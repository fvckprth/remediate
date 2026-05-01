import { useState, useRef, useEffect } from "react";
import type { WidgetMode } from "../../types";
import { isCaptureMode, isNoteMode } from "../../types";
import { useDraggable } from "../../hooks/useDraggable";
import {
  ScanLine,
  Cursor3Fill,
  PenFill,
  CloseLine,
  Delete2Fill,
  SendFill,
} from "../icons";
import { Tooltip } from "../shared/Tooltip";

interface FeedbackBarProps {
  isIdle: boolean;
  onActivate: () => void;
  mode: WidgetMode;
  markerColor: string;
  itemCount: number;
  hasContent: boolean;
  onSetMode: (mode: WidgetMode) => void;
  onClose: () => void;
  onReview: () => void;
  onDeleteAll: () => void;
  onPositionChange?: (pos: { x: number; y: number } | null) => void;
  onAnchorX?: (x: number) => void;
  panelOpen?: boolean;
}

export function FeedbackBar({
  isIdle,
  onActivate,
  mode,
  markerColor,
  itemCount,
  hasContent,
  onSetMode,
  onClose,
  onReview,
  onDeleteAll,
  onPositionChange,
  onAnchorX,
  panelOpen,
}: FeedbackBarProps) {
  const captureActive = isCaptureMode(mode);
  const annotateActive = mode === "annotating";
  const noteActive = isNoteMode(mode);

  const [tooltipsHidden, setTooltipsHidden] = useState(false);
  const hideTooltips = () => setTooltipsHidden(true);
  const showTooltips = () => setTooltipsHidden(false);

  const { barRef, position, isDragging, justDragged, handleMouseDown } = useDraggable({
    enabled: !panelOpen,
    onPositionChange,
  });

  // Measure tools width and set bar width dynamically
  const toolsRef = useRef<HTMLDivElement>(null);
  const BAR_PADDING = 8;

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (isIdle) {
      if (itemCount > 0) {
        bar.style.width = itemCount > 9 ? "48px" : "36px";
        bar.style.height = "36px";
      } else {
        bar.style.width = "";
        bar.style.height = "40px";
      }
      return;
    }
    const tools = toolsRef.current;
    if (!tools) return;
    const id = requestAnimationFrame(() => {
      const width = tools.scrollWidth + BAR_PADDING;
      bar.style.width = `${width}px`;
      bar.style.height = "40px";
    });
    return () => cancelAnimationFrame(id);
  }, [isIdle, hasContent, itemCount, barRef]);

  const guardClick = (fn: () => void) => {
    if (justDragged.current) return;
    fn();
  };

  const reportAnchor = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onAnchorX?.(rect.left + rect.width / 2);
  };

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
      <button
        className={`rm-bar__trigger ${isIdle ? "" : "rm-bar__trigger--hidden"} ${isIdle && itemCount > 0 ? "rm-bar__trigger--count" : ""}`}
        onClick={() => guardClick(onActivate)}
        aria-label={itemCount > 0 ? `Open feedback widget, ${itemCount} items` : "Open feedback widget"}
      >
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

      <div
        ref={toolsRef}
        className={`rm-bar__tools ${isIdle ? "" : "rm-bar__tools--visible"}`}
        onMouseLeave={showTooltips}
      >
        <div className="rm-toolbar__actions">
          <Tooltip content="Capture" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${captureActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={(e) => guardClick(() => {
                hideTooltips();
                if (!captureActive) reportAnchor(e);
                onSetMode(captureActive ? "active" : "captureMenu");
              })}
              aria-label="Capture mode"
            >
              <ScanLine size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Annotate" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${annotateActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={() => guardClick(() => {
                hideTooltips();
                onSetMode(annotateActive ? "active" : "annotating");
              })}
              aria-label="Annotate mode"
            >
              <Cursor3Fill size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Note" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              className={`rm-toolbar-btn ${noteActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={(e) => guardClick(() => {
                hideTooltips();
                if (!noteActive) reportAnchor(e);
                onSetMode(noteActive ? "active" : "noteMenu");
              })}
              aria-label="Note mode"
            >
              <PenFill size={20} />
            </button>
          </Tooltip>
        </div>

        {hasContent && (
          <>
            <div className="rm-toolbar-divider" />
            <div className="rm-toolbar__actions">
              <Tooltip content="Delete all" disabled={tooltipsHidden} anchorRef={barRef}>
                <button
                  className="rm-toolbar-btn"
                  onClick={() => guardClick(() => {
                    hideTooltips();
                    onDeleteAll();
                  })}
                  aria-label="Delete all items"
                >
                  <Delete2Fill size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Review" disabled={tooltipsHidden} anchorRef={barRef}>
                <button
                  className="rm-toolbar-btn rm-toolbar-btn--review"
                  onClick={(e) => guardClick(() => {
                    hideTooltips();
                    reportAnchor(e);
                    onReview();
                  })}
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
            onClick={() => guardClick(() => {
              hideTooltips();
              onClose();
            })}
            aria-label="Close widget"
          >
            <CloseLine size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
