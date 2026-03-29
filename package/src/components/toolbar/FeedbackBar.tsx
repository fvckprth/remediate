import { useState, useRef, useEffect, useCallback } from "react";
import type { WidgetMode } from "../../types";
import { isCaptureMode, isNoteMode } from "../../types";
import {
  ScanLine,
  Cursor3Fill,
  PenFill,
  Settings1Fill,
  CloseLine,
  Copy2Fill,
  Delete2Fill,
  CheckLine,
  SendFill,
} from "../icons";
import { Tooltip } from "../shared/Tooltip";

const DRAG_THRESHOLD = 5;
const VIEWPORT_PADDING = 20;

interface FeedbackBarProps {
  isIdle: boolean;
  onActivate: () => void;
  mode: WidgetMode;
  settingsOpen: boolean;
  markerColor: string;
  itemCount: number;
  hasContent: boolean;
  copiedFlash: boolean;
  onSetMode: (mode: WidgetMode) => void;
  onToggleSettings: () => void;
  onClose: () => void;
  onReview: () => void;
  onCopy: () => void;
  onDeleteAll: () => void;
  onPositionChange?: (pos: { x: number; y: number } | null) => void;
  onAnchorX?: (x: number) => void;
  panelOpen?: boolean;
}

export function FeedbackBar({
  isIdle,
  onActivate,
  mode,
  settingsOpen,
  markerColor,
  itemCount,
  hasContent,
  copiedFlash,
  onSetMode,
  onToggleSettings,
  onClose,
  onReview,
  onCopy,
  onDeleteAll,
  onPositionChange,
  onAnchorX,
  panelOpen,
}: FeedbackBarProps) {
  const captureActive = isCaptureMode(mode);
  const annotateActive = mode === "annotating";
  const noteActive = isNoteMode(mode);

  // Hide tooltips when any button is clicked (panel opens); re-enable on mouse leave
  const [tooltipsHidden, setTooltipsHidden] = useState(false);
  const hideTooltips = () => setTooltipsHidden(true);
  const showTooltips = () => setTooltipsHidden(false);

  // Measure tools width and set bar width dynamically
  const toolsRef = useRef<HTMLDivElement>(null);
  const BAR_PADDING = 8; // 4px padding each side

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (isIdle) {
      if (itemCount > 0) {
        // Morph to count circle/pill
        bar.style.width = itemCount > 9 ? "48px" : "36px";
        bar.style.height = "36px";
      } else {
        // Default idle feedback button
        bar.style.width = "";
        bar.style.height = "40px";
      }
      return;
    }
    const tools = toolsRef.current;
    if (!tools) return;
    // Use rAF to measure after DOM has updated
    const id = requestAnimationFrame(() => {
      const width = tools.scrollWidth + BAR_PADDING;
      bar.style.width = `${width}px`;
      bar.style.height = "40px";
    });
    return () => cancelAnimationFrame(id);
  }, [isIdle, hasContent, itemCount]);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number; r: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; barX: number; barY: number } | null>(null);
  const didDragRef = useRef(false);
  const justFinishedDragRef = useRef(false);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  // Keep a ref to current values needed in event handlers (avoids stale closures)
  const positionRef = useRef(position);
  positionRef.current = position;
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  // Load saved position from localStorage on mount, or report default position
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("rm_bar_position");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.r === undefined) {
          parsed.r = window.innerWidth - parsed.x - 90;
        }
        setPosition(parsed);
        onPositionChange?.(parsed);
        return;
      } catch (e) {}
    }
    // No saved position — report the bar's default DOM position after first paint
    requestAnimationFrame(() => {
      const bar = barRef.current;
      if (bar) {
        const rect = bar.getBoundingClientRect();
        onPositionChangeRef.current?.({ x: rect.left, y: rect.top });
      }
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (panelOpen) return;
    const bar = barRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      barX: rect.left,
      barY: rect.top,
    };
    didDragRef.current = false;

    const handleMouseMove = (ev: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;

      const deltaX = ev.clientX - start.mouseX;
      const deltaY = ev.clientY - start.mouseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!didDragRef.current && distance < DRAG_THRESHOLD) return;

      if (!didDragRef.current) {
        didDragRef.current = true;
        setIsDragging(true);
      }

      // Constrain to viewport
      const barWidth = bar.offsetWidth;
      const barHeight = bar.offsetHeight;
      const newX = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerWidth - barWidth - VIEWPORT_PADDING, start.barX + deltaX)
      );
      const newY = Math.max(
        VIEWPORT_PADDING,
        Math.min(window.innerHeight - barHeight - VIEWPORT_PADDING, start.barY + deltaY)
      );

      // Direct DOM manipulation for smooth dragging (no React re-renders)
      bar.style.left = `${newX}px`;
      bar.style.top = `${newY}px`;
      bar.style.right = "auto";
      bar.style.bottom = "auto";
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);

      if (didDragRef.current) {
        // Read final position from the DOM
        const rect = bar.getBoundingClientRect();
        const finalPos = { x: rect.left, y: rect.top, r: window.innerWidth - rect.right };

        setPosition(finalPos);
        setIsDragging(false);
        localStorage.setItem("rm_bar_position", JSON.stringify(finalPos));
        onPositionChangeRef.current?.(finalPos);

        // Suppress the click that follows mouseup
        justFinishedDragRef.current = true;
        requestAnimationFrame(() => {
          setTimeout(() => {
            justFinishedDragRef.current = false;
          }, 0);
        });
      }

      dragStartRef.current = null;
      dragCleanupRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    dragCleanupRef.current = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [panelOpen]);

  // Clean up drag listeners if component unmounts mid-drag
  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
    };
  }, []);

  const handleActivateClick = (e: React.MouseEvent) => {
    if (justFinishedDragRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onActivate();
  };

  const reportAnchor = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onAnchorX?.(rect.left + rect.width / 2);
  };

  function handleCaptureClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (justFinishedDragRef.current) return;
    hideTooltips();
    if (!captureActive) reportAnchor(e);
    onSetMode(captureActive ? "active" : "captureMenu");
  }

  function handleAnnotateClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (justFinishedDragRef.current) return;
    hideTooltips();
    onSetMode(annotateActive ? "active" : "annotating");
  }

  function handleNoteClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (justFinishedDragRef.current) return;
    hideTooltips();
    if (!noteActive) reportAnchor(e);
    onSetMode(noteActive ? "active" : "noteMenu");
  }

  return (
    <div
      ref={barRef}
      className={`rm-bar ${!position ? "rm-pos-br" : ""} ${isIdle ? "" : "rm-bar--expanded"} ${isDragging ? "rm-bar--dragging" : ""} ${isIdle && itemCount > 0 ? "rm-bar--count-only" : ""}`}
      data-remediate-widget=""
      data-has-submenu={
        mode === "captureMenu" || mode === "noteMenu" || undefined
      }
      data-has-content={hasContent}
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        zIndex: 999999,
        visibility: "var(--rm-ready, hidden)" as any,
        ...(isIdle && itemCount > 0 ? { background: markerColor } : {}),
        ...(position
          ? position.r < position.x
            ? { right: position.r, top: position.y, left: "auto", bottom: "auto" }
            : { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : {}),
      }}
    >
      {/* Feedback trigger text — absolutely positioned */}
      <button
        className={`rm-bar__trigger ${isIdle ? "" : "rm-bar__trigger--hidden"} ${isIdle && itemCount > 0 ? "rm-bar__trigger--count" : ""}`}
        onClick={handleActivateClick}
        aria-label={itemCount > 0 ? `Open feedback widget, ${itemCount} items` : "Open feedback widget"}
      >
        {/* We always render both and use CSS to crossfade them based on state to prevent layout jumps or text flashing */}
        <span className={`rm-bar__count-text ${isIdle && itemCount > 0 ? "rm-bar__count-text--visible" : ""}`}>
          {itemCount > 0 ? itemCount : ""}
        </span>
        <div className={`rm-bar__text-wrapper ${isIdle && itemCount > 0 ? "rm-bar__text-wrapper--hidden" : ""}`}>
          <span className="rm-bar__text">Feedback</span>
          {isIdle && itemCount > 0 && (
            <span className="rm-bar__badge">{itemCount}</span>
          )}
        </div>
      </button>

      {/* Toolbar icons */}
      <div
        ref={toolsRef}
        className={`rm-bar__tools ${isIdle ? "" : "rm-bar__tools--visible"}`}
        onMouseLeave={showTooltips}
      >
        <div className="rm-toolbar__actions">
          <Tooltip content="Capture" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${captureActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={handleCaptureClick}
              aria-label="Capture mode"
            >
              <ScanLine size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Annotate" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${annotateActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={handleAnnotateClick}
              aria-label="Annotate mode"
            >
              <Cursor3Fill size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Note" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${noteActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={handleNoteClick}
              aria-label="Note mode"
            >
              <PenFill size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Settings" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${settingsOpen ? "rm-toolbar-btn--active" : ""}`}
              onClick={(e) => {
                if (justFinishedDragRef.current) return;
                hideTooltips();
                if (!settingsOpen) reportAnchor(e);
                onToggleSettings();
              }}
              aria-label="Settings"
            >
              <Settings1Fill size={20} />
            </button>
          </Tooltip>
        </div>

        {hasContent && (
          <>
            <div className="rm-toolbar-divider" />
            <div className="rm-toolbar__actions">
              <Tooltip content={copiedFlash ? "Copied!" : "Copy"} disabled={tooltipsHidden} anchorRef={barRef}>
                <button
                  className="rm-toolbar-btn rm-toolbar-btn--icon-swap"
                  onClick={() => {
                    if (justFinishedDragRef.current) return;
                    hideTooltips();
                    onCopy();
                  }}
                  aria-label="Copy to clipboard"
                >
                  <span className={`rm-icon-swap ${copiedFlash ? "rm-icon-swap--out" : "rm-icon-swap--in"}`}>
                    <Copy2Fill size={20} />
                  </span>
                  <span className={`rm-icon-swap ${copiedFlash ? "rm-icon-swap--in" : "rm-icon-swap--out"}`}>
                    <CheckLine size={20} />
                  </span>
                </button>
              </Tooltip>
              <Tooltip content="Delete all" disabled={tooltipsHidden} anchorRef={barRef}>
                <button
                  className="rm-toolbar-btn"
                  onClick={() => {
                    if (justFinishedDragRef.current) return;
                    hideTooltips();
                    onDeleteAll();
                  }}
                  aria-label="Delete all items"
                >
                  <Delete2Fill size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Review" disabled={tooltipsHidden} anchorRef={barRef}>
                <button
                  className="rm-toolbar-btn rm-toolbar-btn--review"
                  onClick={(e) => {
                    if (justFinishedDragRef.current) return;
                    hideTooltips();
                    reportAnchor(e);
                    onReview();
                  }}
                  aria-label="Review and submit"
                >
                  <SendFill size={20} />
                  <span
                    className="rm-toolbar-btn__badge"
                    style={{ background: markerColor }}
                  >
                    {itemCount}
                  </span>
                </button>
              </Tooltip>
            </div>
          </>
        )}

        <div className="rm-toolbar-divider" />

        <Tooltip content="Close" disabled={tooltipsHidden} anchorRef={barRef}>
          <button
            className="rm-toolbar-btn rm-toolbar-btn--close"
            onClick={() => {
              if (justFinishedDragRef.current) return;
              hideTooltips();
              onClose();
            }}
            aria-label="Close widget"
          >
            <CloseLine size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
