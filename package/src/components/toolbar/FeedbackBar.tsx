import { useState, useRef, useEffect, type RefObject } from "react";
import type { WidgetMode } from "../../types";
import { isCaptureMode, isNoteMode } from "../../types";
import { useDraggable } from "../../hooks/useDraggable";
import {
  ScanLine, Cursor3Fill, PenFill, CloseLine, Delete2Fill, SendFill, CheckLine, AlertDiamondFill,
} from "../icons";
import { Tooltip } from "../shared/Tooltip";

interface FeedbackBarProps {
  mode: WidgetMode;
  markerColor: string;
  itemCount: number;
  onActivate: () => void;
  onSetMode: (mode: WidgetMode) => void;
  onClose: () => void;
  onReview: () => void;
  onDeleteAll: () => void;
  panelOpen?: boolean;
  barRef: RefObject<HTMLDivElement | null>;
}

const BAR_PADDING = 8;

export function FeedbackBar({
  mode, markerColor, itemCount, onActivate, onSetMode, onClose, onReview, onDeleteAll, panelOpen, barRef,
}: FeedbackBarProps) {
  const isIdle = mode === "idle";
  const hasContent = itemCount > 0;
  const status = mode === "success" ? "success" : mode === "submitError" ? "error" : null;
  const showTools = !isIdle && !status;
  const captureActive = isCaptureMode(mode);
  const annotateActive = mode === "annotating";
  const noteActive = isNoteMode(mode);
  const countOnly = isIdle && hasContent;

  const [tooltipsHidden, setTooltipsHidden] = useState(false);
  const hideTooltips = () => setTooltipsHidden(true);
  const showTooltips = () => setTooltipsHidden(false);

  const { position, isDragging, justDragged, handleMouseDown } = useDraggable({
    enabled: !panelOpen,
    barRef,
  });

  // Morph the bar to fit its current contents. Fixed states are sized here so the
  // width transition runs between every state; the expanded width is measured.
  const toolsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (status === "success") { bar.style.width = "48px"; bar.style.height = "40px"; return; }
    if (status === "error") { bar.style.width = "172px"; bar.style.height = "40px"; return; }
    if (isIdle) {
      if (hasContent) {
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
      bar.style.width = `${tools.scrollWidth + BAR_PADDING}px`;
      bar.style.height = "40px";
    });
    return () => cancelAnimationFrame(id);
  }, [isIdle, status, hasContent, itemCount, barRef]);

  const guardClick = (fn: () => void) => () => {
    if (justDragged.current) return;
    hideTooltips();
    fn();
  };

  return (
    <div
      ref={barRef}
      className={`rm-bar ${!position ? "rm-pos-br" : ""} ${isIdle ? "" : "rm-bar--expanded"} ${isDragging ? "rm-bar--dragging" : ""} ${countOnly ? "rm-bar--count-only" : ""}`}
      data-remediate-widget=""
      data-status={status ?? undefined}
      onMouseDown={handleMouseDown}
      style={{
        position: "fixed",
        zIndex: "var(--rm-z-bar)" as unknown as number,
        visibility: "var(--rm-ready, hidden)" as React.CSSProperties["visibility"],
        ...(position
          ? position.r < position.x
            ? { right: position.r, top: position.y, left: "auto", bottom: "auto" }
            : { left: position.x, top: position.y, right: "auto", bottom: "auto" }
          : {}),
      }}
    >
      <button
        type="button"
        className={`rm-bar__trigger ${isIdle ? "" : "rm-bar__trigger--hidden"} ${countOnly ? "rm-bar__trigger--count" : ""}`}
        onClick={guardClick(onActivate)}
        aria-label={hasContent ? `Open feedback widget, ${itemCount} items` : "Open feedback widget"}
        aria-expanded={!isIdle}
        tabIndex={isIdle ? 0 : -1}
        aria-hidden={!isIdle}
      >
        <span className={`rm-bar__count-text ${countOnly ? "rm-bar__count-text--visible" : ""}`}>
          {hasContent ? itemCount : ""}
        </span>
        <div className={`rm-bar__text-wrapper ${countOnly ? "rm-bar__text-wrapper--hidden" : ""}`}>
          <span className="rm-bar__text">Feedback</span>
        </div>
      </button>

      {/* Submit outcome, announced to assistive tech and auto-cleared by the parent */}
      <div role="status" aria-live="polite" className="rm-bar__status">
        {status === "success" && (
          <div className="rm-bar__check" aria-label="Sent">
            <CheckLine size={24} />
          </div>
        )}
        {status === "error" && (
          <div className="rm-bar__error">
            <AlertDiamondFill size={20} />
            <span className="rm-bar__error-text">Submission Failed</span>
          </div>
        )}
      </div>

      {/* Tools are always mounted for the morph; `inert` keeps hidden tools out of the tab order */}
      <div
        ref={toolsRef}
        className={`rm-bar__tools ${showTools ? "rm-bar__tools--visible" : ""}`}
        onMouseLeave={showTooltips}
        inert={!showTools}
      >
        <div className="rm-toolbar__actions">
          <Tooltip content="Capture" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              type="button"
              className={`rm-toolbar-btn ${captureActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={guardClick(() => onSetMode(captureActive ? "active" : "captureMenu"))}
              aria-label="Capture mode"
              aria-pressed={captureActive}
              data-rm-anchor="capture"
            >
              <ScanLine size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Annotate" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              type="button"
              className={`rm-toolbar-btn ${annotateActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={guardClick(() => onSetMode(annotateActive ? "active" : "annotating"))}
              aria-label="Annotate mode"
              aria-pressed={annotateActive}
            >
              <Cursor3Fill size={20} />
            </button>
          </Tooltip>

          <Tooltip content="Note" disabled={tooltipsHidden} anchorRef={barRef}>
            <button
              type="button"
              className={`rm-toolbar-btn ${noteActive ? "rm-toolbar-btn--active" : ""}`}
              onClick={guardClick(() => onSetMode(noteActive ? "active" : "noteMenu"))}
              aria-label="Note mode"
              aria-pressed={noteActive}
              data-rm-anchor="note"
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
                  type="button"
                  className="rm-toolbar-btn"
                  onClick={guardClick(onDeleteAll)}
                  aria-label="Delete all items"
                >
                  <Delete2Fill size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Review" disabled={tooltipsHidden} anchorRef={barRef}>
                <button
                  type="button"
                  className="rm-toolbar-btn rm-toolbar-btn--review"
                  onClick={guardClick(onReview)}
                  aria-label={`Review and submit, ${itemCount} items`}
                  data-rm-anchor="review"
                >
                  <SendFill size={20} />
                  <span className="rm-toolbar-btn__badge" style={{ background: markerColor }} aria-hidden="true">
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
            type="button"
            className="rm-toolbar-btn rm-toolbar-btn--close"
            onClick={guardClick(onClose)}
            aria-label="Close widget"
          >
            <CloseLine size={20} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
