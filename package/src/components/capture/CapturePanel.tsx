import { useState, useEffect, useRef, useCallback } from "react";
import type { SelectionArea, AnnotationPriority, PhotoCapture, VideoCapture } from "../../types";
import { PlayFill, PauseFill } from "../icons";
import { NoteComposer } from "../shared/NoteComposer";
import { PanelActions } from "../shared/PanelActions";
import { useNoteDraft } from "../../hooks/useNoteDraft";

interface CapturePanelProps {
  variant: "photo" | "video";
  area: SelectionArea | null;
  blob: Blob | null;
  onAdd: (additionalText: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
}

export function CapturePanel({ variant, area, blob, onAdd, onCancel }: CapturePanelProps) {
  const draft = useNoteDraft<PhotoCapture | VideoCapture>(variant, (item) => item.additionalText);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!blob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  const handleSubmit = useCallback(() => {
    onAdd(draft.text, draft.priority);
  }, [draft.text, draft.priority, onAdd]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const areaLabel = area
    ? `${Math.round(area.width)} × ${Math.round(area.height)} at (${Math.round(area.x)}, ${Math.round(area.y)})`
    : "No area selected";

  const previewHeight = area ? Math.min(200, 252 * (area.height / Math.max(1, area.width))) : undefined;

  return (
    <div className="rm-capture-panel" data-remediate-widget="">
      <div className="rm-popover__header">
        <span className="rm-popover__header-meta">{areaLabel}</span>
      </div>

      <div className="rm-capture-panel__preview" style={previewHeight ? { height: previewHeight } : undefined}>
        {variant === "photo" && previewUrl ? (
          <img src={previewUrl} alt="Screenshot preview" className="rm-capture-panel__preview-img" />
        ) : variant === "video" && previewUrl ? (
          <>
            <video
              ref={videoRef}
              src={previewUrl}
              className="rm-capture-panel__preview-img"
              playsInline
              onEnded={() => setIsPlaying(false)}
            />
            <button
              type="button"
              className="rm-video-play-btn"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseFill size={16} /> : <PlayFill size={16} />}
            </button>
          </>
        ) : (
          <div className="rm-capture-panel__placeholder">
            <span className="rm-capture-panel__placeholder-text">
              {variant === "photo" ? "Screenshot captured" : "Recording captured"}
            </span>
          </div>
        )}
      </div>

      <NoteComposer
        value={draft.text}
        onChange={draft.setText}
        priority={draft.priority}
        onPriorityChange={draft.setPriority}
        placeholder="Add a note (optional)"
        onSubmit={handleSubmit}
      />

      <div className="rm-capture-panel__footer">
        <PanelActions onCancel={onCancel} onSubmit={handleSubmit} submitLabel={draft.submitLabel} />
      </div>
    </div>
  );
}
