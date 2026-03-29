import type { WidgetMode } from "../../types";
import { isCaptureMode, isNoteMode } from "../../types";
import {
  ScanLine,
  Cursor3Fill,
  PenFill,
  Settings1Fill,
  CloseLine,
  Copy2Fill,
  SendFill,
} from "../icons";

interface ToolbarProps {
  mode: WidgetMode;
  markerColor: string;
  itemCount: number;
  hasContent: boolean;
  copiedFlash: boolean;
  onSetMode: (mode: WidgetMode) => void;
  onToggleSettings: () => void;
  onClose: () => void;
  onReview: () => void;
  onCopy: () => void;
}

export function Toolbar({
  mode,
  markerColor,
  itemCount,
  hasContent,
  copiedFlash,
  onSetMode,
  onToggleSettings,
  onClose,
  onReview,
  onCopy,
}: ToolbarProps) {
  const captureActive = isCaptureMode(mode);
  const annotateActive = mode === "annotating";
  const noteActive = isNoteMode(mode);

  function handleCaptureClick() {
    onSetMode(captureActive ? "active" : "captureMenu");
  }

  function handleAnnotateClick() {
    onSetMode(annotateActive ? "active" : "annotating");
  }

  function handleNoteClick() {
    onSetMode(noteActive ? "active" : "noteMenu");
  }

  return (
    <div className="rm-toolbar rm-pos-bl" data-remediate-widget="" data-has-submenu={mode === "captureMenu" || mode === "noteMenu" || undefined}>
      <div className="rm-toolbar__actions">
        <button
          className={`rm-toolbar-btn ${captureActive ? "rm-toolbar-btn--active" : ""}`}
          onClick={handleCaptureClick}
          data-tooltip="Capture"
          aria-label="Capture mode"
        >
          <ScanLine size={20} />
        </button>

        <button
          className={`rm-toolbar-btn ${annotateActive ? "rm-toolbar-btn--active" : ""}`}
          onClick={handleAnnotateClick}
          data-tooltip="Annotate"
          aria-label="Annotate mode"
        >
          <Cursor3Fill size={20} />
        </button>

        <button
          className={`rm-toolbar-btn ${noteActive ? "rm-toolbar-btn--active" : ""}`}
          onClick={handleNoteClick}
          data-tooltip="Note"
          aria-label="Note mode"
        >
          <PenFill size={20} />
        </button>

        <button
          className="rm-toolbar-btn"
          onClick={onToggleSettings}
          data-tooltip="Settings"
          aria-label="Settings"
        >
          <Settings1Fill size={20} />
        </button>
      </div>

      {hasContent && (
        <>
          <div className="rm-toolbar-divider" />
          <button
            className="rm-toolbar-btn"
            onClick={onCopy}
            data-tooltip={copiedFlash ? "Copied!" : "Copy"}
            aria-label="Copy to clipboard"
          >
            {copiedFlash ? (
              <span className="rm-copied-check">&#10003;</span>
            ) : (
              <Copy2Fill size={20} />
            )}
          </button>
          <button
            className="rm-toolbar-btn rm-toolbar-btn--review"
            onClick={onReview}
            data-tooltip="Review"
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
        </>
      )}

      <div className="rm-toolbar-divider" />

      <button
        className="rm-toolbar-btn rm-toolbar-btn--close"
        onClick={onClose}
        data-tooltip="Close"
        aria-label="Close widget"
      >
        <CloseLine size={20} />
      </button>
    </div>
  );
}
