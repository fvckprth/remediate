import { useState, useRef, useCallback, useEffect } from "react";
import type { AnnotationItem, AnnotationPriority } from "../../types";
import { captureElement } from "../../utils/capture";
import { identifyElement } from "../../utils/element-identify";
import { nanoid } from "../../utils/nanoid";
import { AnnotationBadge } from "./AnnotationBadge";
import { AnnotationPopover, type AnnotationPopoverRef } from "./AnnotationPopover";
import { HighlightOverlay } from "../shared/HighlightOverlay";

const DRAG_THRESHOLD = 5;
const MULTI_SELECT_COLOR = "#22c55e";

const MEANINGFUL_TAGS = new Set([
  "button", "a", "input", "select", "textarea", "img", "video",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "label",
]);

function isMeaningfulElement(el: HTMLElement): boolean {
  if (MEANINGFUL_TAGS.has(el.tagName.toLowerCase())) return true;
  if (el.getAttribute("role") === "button") return true;
  if (el.hasAttribute("tabindex")) return true;
  const rect = el.getBoundingClientRect();
  if (rect.width < 10 || rect.height < 10) return false;
  if (rect.width > window.innerWidth * 0.8) return false;
  return false;
}

function computeBoundingBox(rects: DOMRect[]): DOMRect {
  if (rects.length === 0) return new DOMRect();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    minX = Math.min(minX, r.left);
    minY = Math.min(minY, r.top);
    maxX = Math.max(maxX, r.right);
    maxY = Math.max(maxY, r.bottom);
  }
  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

interface PendingElement {
  id: string;
  element: ReturnType<typeof captureElement>;
  rect: DOMRect;
  domElement: HTMLElement;
  clickOffset: { x: number; y: number };
}

interface AnnotateModeProps {
  annotations: AnnotationItem[];
  markerColor: string;
  nextIndex: number;
  onAddAnnotation: (annotation: AnnotationItem) => void;
}

export function AnnotateMode({
  annotations,
  markerColor,
  nextIndex,
  onAddAnnotation,
}: AnnotateModeProps) {
  const [hoverInfo, setHoverInfo] = useState<{ rect: DOMRect; name: string; domElement: HTMLElement } | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [pendingElements, setPendingElements] = useState<PendingElement[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<AnnotationPopoverRef>(null);
  const modifiersHeldRef = useRef({ meta: false, shift: false });

  // Drag-to-select state
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragBox, setDragBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [dragHighlights, setDragHighlights] = useState<DOMRect[]>([]);

  const isWidgetElement = useCallback((el: Element | null): boolean => {
    if (!el) return false;
    let current: Element | null = el;
    while (current) {
      if (current.hasAttribute("data-remediate-widget")) return true;
      if (current.classList?.contains("rm-popover")) return true;
      if (current.classList?.contains("rm-badge")) return true;
      if (current.classList?.contains("rm-toolbar")) return true;
      if (current.classList?.contains("rm-settings")) return true;
      if (current.classList?.contains("rm-bar")) return true;
      current = current.parentElement;
    }
    return false;
  }, []);

  const getElementAtPoint = useCallback((x: number, y: number): HTMLElement | null => {
    const overlay = overlayRef.current;
    if (!overlay) return null;
    overlay.style.pointerEvents = "none";
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    overlay.style.pointerEvents = "auto";
    if (!el || el === document.documentElement || el === document.body || isWidgetElement(el)) {
      return null;
    }
    return el;
  }, [isWidgetElement]);

  // Track modifier keys for multi-select
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      modifiersHeldRef.current = { meta: e.metaKey || e.ctrlKey, shift: e.shiftKey };
    }
    function handleKeyUp(e: KeyboardEvent) {
      const wasBothHeld = modifiersHeldRef.current.meta && modifiersHeldRef.current.shift;
      modifiersHeldRef.current = { meta: e.metaKey || e.ctrlKey, shift: e.shiftKey };
      const nowBothHeld = modifiersHeldRef.current.meta && modifiersHeldRef.current.shift;

      // Both modifiers released → finalize multi-select
      if (wasBothHeld && !nowBothHeld && pendingElements.length > 0 && !showPopover) {
        setShowPopover(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [pendingElements.length, showPopover]);

  // Hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (showPopover || isDragging) return;

      // Handle drag detection
      if (dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (dx * dx + dy * dy >= DRAG_THRESHOLD * DRAG_THRESHOLD) {
          setIsDragging(true);
        }
      }

      if (!dragStartRef.current) {
        const el = getElementAtPoint(e.clientX, e.clientY);
        if (el) {
          setHoverInfo({ rect: el.getBoundingClientRect(), name: identifyElement(el).name, domElement: el });
          setHoverPos({ x: e.clientX, y: e.clientY });
        } else {
          setHoverInfo(null);
        }
      }
    },
    [showPopover, isDragging, getElementAtPoint]
  );

  // Drag move — update drag box + highlights
  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;

      const left = Math.min(dragStartRef.current.x, e.clientX);
      const top = Math.min(dragStartRef.current.y, e.clientY);
      const width = Math.abs(e.clientX - dragStartRef.current.x);
      const height = Math.abs(e.clientY - dragStartRef.current.y);
      setDragBox({ left, top, width, height });

      // Sample 9 points in the drag rect
      const overlay = overlayRef.current;
      if (!overlay) return;
      overlay.style.pointerEvents = "none";

      const seen = new Set<HTMLElement>();
      const matched: DOMRect[] = [];
      const points = [
        [left, top], [left + width / 2, top], [left + width, top],
        [left, top + height / 2], [left + width / 2, top + height / 2], [left + width, top + height / 2],
        [left, top + height], [left + width / 2, top + height], [left + width, top + height],
      ];

      for (const [px, py] of points) {
        const el = document.elementFromPoint(px, py) as HTMLElement | null;
        if (el && !seen.has(el) && !isWidgetElement(el) && el !== document.documentElement && el !== document.body) {
          seen.add(el);
          if (isMeaningfulElement(el)) {
            matched.push(el.getBoundingClientRect());
          }
        }
      }

      overlay.style.pointerEvents = "auto";
      setDragHighlights(matched);
    },
    [isDragging, isWidgetElement]
  );

  // Mouse down — start potential drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (showPopover) return;
      // Skip drag from text elements
      const tag = (e.target as HTMLElement).tagName;
      if (["P", "SPAN", "H1", "H2", "H3", "H4", "H5", "H6", "A", "LABEL", "LI"].includes(tag)) return;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    },
    [showPopover]
  );

  // Mouse up — finalize drag or handle as click
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        // Finalize drag-to-select
        const left = Math.min(dragStartRef.current.x, e.clientX);
        const top = Math.min(dragStartRef.current.y, e.clientY);
        const width = Math.abs(e.clientX - dragStartRef.current.x);
        const height = Math.abs(e.clientY - dragStartRef.current.y);

        const overlay = overlayRef.current;
        if (overlay) {
          overlay.style.pointerEvents = "none";

          const seen = new Set<HTMLElement>();
          const elements: PendingElement[] = [];
          const points = [
            [left, top], [left + width / 2, top], [left + width, top],
            [left, top + height / 2], [left + width / 2, top + height / 2], [left + width, top + height / 2],
            [left, top + height], [left + width / 2, top + height], [left + width, top + height],
          ];

          for (const [px, py] of points) {
            const el = document.elementFromPoint(px, py) as HTMLElement | null;
            if (el && !seen.has(el) && !isWidgetElement(el) && el !== document.documentElement && el !== document.body) {
              seen.add(el);
              if (isMeaningfulElement(el)) {
                const elRect = el.getBoundingClientRect();
                elements.push({
                  id: `ann_${nanoid(8)}`,
                  element: captureElement(el),
                  rect: elRect,
                  domElement: el,
                  clickOffset: { x: elRect.width / 2, y: elRect.height / 2 },
                });
              }
            }
          }

          overlay.style.pointerEvents = "auto";

          if (elements.length > 0) {
            setPendingElements(elements);
            setShowPopover(true);
          }
        }

        setIsDragging(false);
        setDragBox(null);
        setDragHighlights([]);
        dragStartRef.current = null;
        return;
      }

      dragStartRef.current = null;
    },
    [isDragging, isWidgetElement]
  );

  // Click — single or multi-select
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;

      // If popover is showing, shake it instead of dismissing
      if (showPopover) {
        popoverRef.current?.shake();
        return;
      }

      const el = getElementAtPoint(e.clientX, e.clientY);
      if (!el) return;

      const isMultiSelect = (e.metaKey || e.ctrlKey) && e.shiftKey;

      if (isMultiSelect) {
        // Toggle element in/out of pending
        const existingIdx = pendingElements.findIndex((p) => p.domElement === el);
        if (existingIdx >= 0) {
          setPendingElements((prev) => prev.filter((_, i) => i !== existingIdx));
        } else {
          const captured = captureElement(el);
          const id = `ann_${nanoid(8)}`;
          const rect = el.getBoundingClientRect();
          const clickOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
          setPendingElements((prev) => [...prev, { id, element: captured, rect, domElement: el, clickOffset }]);
        }
        setHoverInfo(null);
        return;
      }

      // Standard single-click
      const captured = captureElement(el);
      const id = `ann_${nanoid(8)}`;
      const rect = el.getBoundingClientRect();
      const clickOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setPendingElements([{ id, element: captured, rect, domElement: el, clickOffset }]);
      setShowPopover(true);
      setHoverInfo(null);
    },
    [isDragging, showPopover, pendingElements, getElementAtPoint]
  );

  // Add annotations from popover
  const handleAddPending = useCallback(
    (note: string, priority: AnnotationPriority) => {
      if (pendingElements.length === 0) return;
      let idx = nextIndex;
      for (const pe of pendingElements) {
        const item: AnnotationItem = {
          id: pe.id,
          index: idx++,
          type: "annotation",
          element: pe.element,
          note,
          priority,
          clickOffset: pe.clickOffset,
          timestamp: Date.now(),
          additionalText: "",
        };
        onAddAnnotation(item);
      }
      setPendingElements([]);
      setShowPopover(false);
    },
    [pendingElements, nextIndex, onAddAnnotation]
  );

  const handleCancelPending = useCallback(() => {
    setPendingElements([]);
    setShowPopover(false);
  }, []);

  // Compute anchor rect for popover — anchor to last element's click point
  const lastPending = pendingElements[pendingElements.length - 1] ?? null;
  const popoverAnchorRect = lastPending
    ? (() => {
        const cx = lastPending.rect.left + lastPending.clickOffset.x;
        const cy = lastPending.rect.top + lastPending.clickOffset.y;
        return new DOMRect(cx - 1, cy - 1, 2, 2);
      })()
    : null;

  const isMulti = pendingElements.length > 1;
  const pendingColor = isMulti ? MULTI_SELECT_COLOR : markerColor;

  return (
    <div data-remediate-widget="">
      <div
        ref={overlayRef}
        className="rm-overlay"
        onMouseMove={(e) => { handleMouseMove(e); handleDragMove(e); }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
      />

      {/* Hover highlight + tooltip (hidden if element already annotated) */}
      {hoverInfo && !showPopover && pendingElements.length === 0 && !isDragging &&
        !annotations.some((a) => { try { return hoverInfo.domElement.matches(a.element.selector); } catch { return false; } }) && (
        <>
          <HighlightOverlay rect={hoverInfo.rect} color={markerColor} variant="hover" />
          <div
            className="rm-hover-tooltip"
            data-remediate-widget=""
            style={{
              left: Math.max(8, Math.min(hoverPos.x, window.innerWidth - 100)),
              top: hoverPos.y + 16,
            }}
          >
            {hoverInfo.name}
          </div>
        </>
      )}

      {/* Drag selection rectangle */}
      {isDragging && dragBox && (
        <div
          className="rm-drag-selection"
          style={{ left: dragBox.left, top: dragBox.top, width: dragBox.width, height: dragBox.height }}
        />
      )}

      {/* Drag highlights on matched elements */}
      {isDragging && dragHighlights.map((rect, i) => (
        <div
          key={i}
          className="rm-drag-highlight"
          style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
        />
      ))}

      {/* Pending element highlights + badges */}
      {pendingElements.map((pe, i) => {
        const showBadge = !isMulti || i === pendingElements.length - 1;
        return (
          <div key={pe.id} data-remediate-widget="">
            <HighlightOverlay rect={pe.rect} color={pendingColor} variant={isMulti ? "multi-pending" : "persistent"} />
            {showBadge && (
              <AnnotationBadge
                index={nextIndex + i}
                rect={pe.rect}
                clickOffset={pe.clickOffset}
                color={pendingColor}
                onClick={() => {}}
                variant={isMulti ? "multi-pending" : "pending"}
              />
            )}
          </div>
        );
      })}

      {/* Popover for pending annotations */}
      {showPopover && popoverAnchorRect && lastPending && (
        <AnnotationPopover
          ref={popoverRef}
          elementName={isMulti
            ? `${pendingElements.length} elements`
            : lastPending.element.name}
          selector={lastPending.element.selector}
          computedStyles={lastPending.element.computedStyles}
          initialNote=""
          initialPriority="none"
          annotationIndex={nextIndex}
          anchorRect={popoverAnchorRect}
          onSave={handleAddPending}
          onCancel={handleCancelPending}
          placeholder={isMulti ? "Feedback for this group of elements..." : undefined}
        />
      )}

    </div>
  );
}
