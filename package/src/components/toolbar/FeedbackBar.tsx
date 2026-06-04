import { useState, useRef, useEffect, type RefObject } from "react";
import type { BarEdge, WidgetMode } from "../../types";
import { isCaptureMode, isNoteMode } from "../../types";
import { useDraggable } from "../../hooks/useDraggable";
import { useCollapsible } from "../../hooks/useCollapsible";
import {
  ScanLine,
  Cursor3Fill,
  PenFill,
  CloseLine,
  Delete2Fill,
  SendFill,
  CheckLine,
  AlertDiamondFill,
  RightSmallLine,
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
  onAnchorAriaLabel?: (ariaLabel: string) => void;
  panelOpen?: boolean;
  snapToEdge?: boolean;
  collapsible?: boolean;
  barRef: RefObject<HTMLDivElement | null>;
}

interface FeedbackBarPosition {
  x: number;
  y: number;
  r: number;
  b?: number;
  edge?: BarEdge;
}

const DEFAULT_DOCK_EDGE: BarEdge = "right";
const DEFAULT_BAR_HEIGHT = 40;

function deriveDockEdge(
  position: FeedbackBarPosition | null,
  explicitEdge?: BarEdge,
): BarEdge {
  if (explicitEdge) return explicitEdge;
  if (!position) return DEFAULT_DOCK_EDGE;

  const bottom =
    typeof position.b === "number"
      ? position.b
      : typeof window === "undefined"
        ? Number.POSITIVE_INFINITY
        : window.innerHeight - position.y - DEFAULT_BAR_HEIGHT;

  const distances: Array<[BarEdge, number]> = [
    ["left", position.x],
    ["right", position.r],
    ["top", position.y],
    ["bottom", bottom],
  ];

  return distances.reduce((nearest, candidate) =>
    candidate[1] < nearest[1] ? candidate : nearest,
  )[0];
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
  onAnchorAriaLabel,
  panelOpen,
  snapToEdge,
  collapsible,
  barRef,
}: FeedbackBarProps) {
  const isSuccess = mode === "success";
  const isError = mode === "submitError";
  const captureActive = isCaptureMode(mode);
  const annotateActive = mode === "annotating";
  const noteActive = isNoteMode(mode);

  const [tooltipsHidden, setTooltipsHidden] = useState(false);
  const hideTooltips = () => setTooltipsHidden(true);
  const showTooltips = () => setTooltipsHidden(false);

  const { position, isDragging, edge, justDragged, handlePointerDown } = useDraggable({
    enabled: !panelOpen,
    snapToEdge: !!snapToEdge,
    barRef,
  });

  const dockEdge = deriveDockEdge(position, edge);
  const { collapsed, toggleCollapsed } = useCollapsible({
    collapsible: !!collapsible,
    edge: dockEdge,
    barRef,
  });

  // Measure tools width and set bar width dynamically
  const toolsRef = useRef<HTMLDivElement>(null);
  const BAR_PADDING = 8;

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (isSuccess) {
      bar.style.width = "48px";
      bar.style.height = "40px";
      return;
    }
    if (isError) {
      bar.style.width = "172px";
      bar.style.height = "40px";
      return;
    }
    if (isIdle) {
      if (itemCount > 0) {
        bar.style.width = itemCount > 9 ? "48px" : "36px";
        bar.style.height = "36px";
      } else {
        bar.style.width = "";
        bar.style.height = collapsed ? "var(--rm-bar-collapsed-size)" : "40px";
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
  }, [isIdle, isSuccess, isError, hasContent, itemCount, collapsible, collapsed, barRef]);

  const guardClick = (fn: () => void) => {
    if (justDragged.current) return;
    fn();
  };

  const reportAnchor = (e: React.MouseEvent<HTMLButtonElement>) => {
    const label = e.currentTarget.getAttribute("aria-label");
    if (label) onAnchorAriaLabel?.(label);
  };

  return (
    <div
      ref={barRef}
      className={`rm-bar ${!position ? "rm-pos-br" : ""} ${isIdle ? "" : "rm-bar--expanded"} ${isDragging ? "rm-bar--dragging" : ""} ${isIdle && itemCount > 0 ? "rm-bar--count-only" : ""} ${collapsed ? "rm-bar--collapsed" : ""}`}
      data-remediate-widget=""
      data-collapsible={collapsible ? "" : undefined}
      data-edge={collapsible ? dockEdge : undefined}
      data-has-submenu={
        mode === "captureMenu" || mode === "noteMenu" || undefined
      }
      data-has-content={hasContent}
      data-success={isSuccess ? "" : undefined}
      data-error={isError ? "" : undefined}
      onPointerDown={collapsed ? undefined : handlePointerDown}
      style={{
        position: "fixed",
        zIndex: 999999,
        visibility: "var(--rm-ready, hidden)" as any,
        ...(isIdle && itemCount > 0 ? { background: markerColor } : {}),
        // Anchor to the nearer horizontal side so widening on expand grows
        // INWARD (a right-docked bar must anchor `right`, else it expands
        // off-screen and clips the toolbar buttons).
        ...(position
          ? {
              ...(position.r < position.x
                ? { right: position.r, left: "auto" }
                : { left: position.x, right: "auto" }),
              ...(snapToEdge && position.edge === "bottom" && typeof position.b === "number"
                ? { bottom: position.b, top: "auto" }
                : { top: position.y, bottom: "auto" }),
            }
          : {}),
      }}
    >
      {collapsed ? (
        <button
          type="button"
          className="rm-bar__tab"
          onClick={toggleCollapsed}
          aria-label="Expand feedback widget"
        >
          <RightSmallLine size={18} />
        </button>
      ) : (
        <div className="rm-bar__content">
          {collapsible && isIdle && itemCount === 0 && (
            <button
              type="button"
              className="rm-bar__collapse"
              onClick={() => guardClick(toggleCollapsed)}
              aria-label="Collapse feedback widget"
            >
              <RightSmallLine size={18} />
            </button>
          )}
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

          {isSuccess && (
            <div className="rm-bar__check">
              <CheckLine size={24} />
            </div>
          )}

          {isError && (
            <div className="rm-bar__error">
              <AlertDiamondFill size={20} />
              <span className="rm-bar__error-text">Submission Failed</span>
            </div>
          )}

          <div
            ref={toolsRef}
            className={`rm-bar__tools ${!isIdle && !isSuccess && !isError ? "rm-bar__tools--visible" : ""}`}
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
              <div className="rm-toolbar__content-actions">
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
              </div>
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
      )}
    </div>
  );
}
