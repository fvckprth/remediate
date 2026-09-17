import { useState, useRef, useCallback, useEffect } from "react";
import type { AnnotationItem, AnnotationPriority } from "../../types";
import { captureElement } from "../../utils/capture";
import { identifyElement } from "../../utils/element-identify";
import { createItem } from "../../utils/create-item";
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
  return (
    MEANINGFUL_TAGS.has(el.tagName.toLowerCase()) ||
    el.getAttribute("role") === "button" ||
    el.hasAttribute("tabindex")
  );
}

function isWidgetElement(el: Element | null): boolean {
  return !!el?.closest("[data-remediate-widget]");
}

function isPageElement(el: Element | null): el is HTMLElement {
  return !!el && el !== document.documentElement && el !== document.body && !isWidgetElement(el);
}

/** Distinct, meaningful page elements under a 3×3 grid of sample points in the rect. */
function elementsInRect(left: number, top: number, width: number, height: number): HTMLElement[] {
  const xs = [left, left + width / 2, left + width];
  const ys = [top, top + height / 2, top + height];
  const seen = new Set<HTMLElement>();
  for (const y of ys) {
    for (const x of xs) {
      const el = document.elementFromPoint(x, y);
      if (isPageElement(el) && isMeaningfulElement(el)) seen.add(el);
    }
  }
  return [...seen];
}

function rectFromPoints(a: { x: number; y: number }, b: { x: number; y: number }) {
  return {
    left: Math.min(a.x, b.x),
    top: Math.min(a.y, b.y),
    width: Math.abs(b.x - a.x),
    height: Math.abs(b.y - a.y),
  };
}

function pendingFrom(el: HTMLElement, clickOffset?: { x: number; y: number }): PendingElement {
  const rect = el.getBoundingClientRect();
  return {
    id: `ann_${nanoid(8)}`,
    element: captureElement(el),
    rect,
    domElement: el,
    clickOffset: clickOffset ?? { x: rect.width / 2, y: rect.height / 2 },
  };
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
  onAddAnnotation: (annotation: AnnotationItem) => void;
}

export function AnnotateMode({ annotations, markerColor, onAddAnnotation }: AnnotateModeProps) {
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

  /** Run `fn` with the overlay transparent to hit-testing. */
  const withOverlayHidden = useCallback(<T,>(fn: () => T): T | null => {
    const overlay = overlayRef.current;
    if (!overlay) return null;
    overlay.style.pointerEvents = "none";
    try {
      return fn();
    } finally {
      overlay.style.pointerEvents = "auto";
    }
  }, []);

  const getElementAtPoint = useCallback((x: number, y: number): HTMLElement | null => {
    const el = withOverlayHidden(() => document.elementFromPoint(x, y));
    return isPageElement(el ?? null) ? el as HTMLElement : null;
  }, [withOverlayHidden]);

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
        setHoverPos({ x: e.clientX, y: e.clientY });
        if (!el) {
          setHoverInfo(null);
        } else if (el !== hoverInfo?.domElement) {
          setHoverInfo({ rect: el.getBoundingClientRect(), name: identifyElement(el).name, domElement: el });
        }
      }
    },
    [showPopover, isDragging, getElementAtPoint, hoverInfo?.domElement]
  );

  // Drag move — update drag box + highlights
  const handleDragMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const box = rectFromPoints(dragStartRef.current, { x: e.clientX, y: e.clientY });
      setDragBox(box);
      const matched = withOverlayHidden(() => elementsInRect(box.left, box.top, box.width, box.height)) ?? [];
      setDragHighlights(matched.map((el) => el.getBoundingClientRect()));
    },
    [isDragging, withOverlayHidden]
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
        const box = rectFromPoints(dragStartRef.current, { x: e.clientX, y: e.clientY });
        const matched = withOverlayHidden(() => elementsInRect(box.left, box.top, box.width, box.height)) ?? [];
        if (matched.length > 0) {
          setPendingElements(matched.map((el) => pendingFrom(el)));
          setShowPopover(true);
        }
        setIsDragging(false);
        setDragBox(null);
        setDragHighlights([]);
      }
      dragStartRef.current = null;
    },
    [isDragging, withOverlayHidden]
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
        const rect = el.getBoundingClientRect();
        const clickOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (existingIdx >= 0) {
          setPendingElements((prev) => prev.filter((_, i) => i !== existingIdx));
        } else {
          setPendingElements((prev) => [...prev, pendingFrom(el, clickOffset)]);
        }
        setHoverInfo(null);
        return;
      }

      // Standard single-click
      const rect = el.getBoundingClientRect();
      setPendingElements([pendingFrom(el, { x: e.clientX - rect.left, y: e.clientY - rect.top })]);
      setShowPopover(true);
      setHoverInfo(null);
    },
    [isDragging, showPopover, pendingElements, getElementAtPoint]
  );

  // Add annotations from popover
  const handleAddPending = useCallback(
    (note: string, priority: AnnotationPriority) => {
      if (pendingElements.length === 0) return;
      for (const pe of pendingElements) {
        // The reducer assigns `index` on ADD_ITEM.
        onAddAnnotation({
          ...createItem("annotation", { element: pe.element, note, priority, clickOffset: pe.clickOffset, additionalText: "" }),
          id: pe.id,
        });
      }
      setPendingElements([]);
      setShowPopover(false);
    },
    [pendingElements, onAddAnnotation]
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
                index={annotations.length + 1 + i}
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
          initialNote=""
          initialPriority="none"
          anchorRect={popoverAnchorRect}
          onSave={handleAddPending}
          onCancel={handleCancelPending}
          placeholder={isMulti ? "Feedback for this group of elements..." : undefined}
        />
      )}

    </div>
  );
}
