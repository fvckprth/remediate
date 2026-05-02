import { useState, useEffect, useRef, useCallback } from "react";
import type { SelectionArea, AnnotationPriority } from "../../types";
import { StopLine, PlayFill, PauseFill } from "../icons";
import { PriorityButton } from "../shared/PriorityButton";

interface CapturePanelProps {
  variant: "photo" | "video";
  area: SelectionArea | null;
  isRecording: boolean;
  screenshotBlob: Blob | null;
  initialText?: string;
  initialPriority?: AnnotationPriority;
  submitLabel?: string;
  onStartRecording: () => void;
  onStopRecording: (duration: number) => void;
  onAdd: (additionalText: string, priority: AnnotationPriority) => void;
  onCancel: () => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function CapturePanel({
  variant,
  area,
  isRecording,
  screenshotBlob,
  onStartRecording,
  onStopRecording,
  initialText,
  initialPriority,
  submitLabel = "Add",
  onAdd,
  onCancel,
}: CapturePanelProps) {
  const [additionalText, setAdditionalText] = useState(initialText ?? "");
  const [priority, setPriority] = useState<AnnotationPriority>(initialPriority ?? "none");
  const [recordingTime, setRecordingTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const showPreview = true;
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  useEffect(() => {
    if (screenshotBlob) {
      const url = URL.createObjectURL(screenshotBlob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [screenshotBlob]);

  const handleSubmit = useCallback(() => {
    onAdd(additionalText, priority);
  }, [additionalText, priority, onAdd]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [handleSubmit, onCancel]
  );

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
    ? `${Math.round(area.width)} \u00d7 ${Math.round(area.height)} at (${Math.round(area.x)}, ${Math.round(area.y)})`
    : "No area selected";

  const previewHeight = area ? Math.min(200, 252 * (area.height / Math.max(1, area.width))) : undefined;

  return (
    <div
      className="rm-capture-panel"
      data-remediate-widget=""
    >
      <div className="rm-popover__header">
        <span className="rm-popover__header-meta">
          {areaLabel}
        </span>
      </div>

      <div 
        className="rm-capture-panel__preview"
        style={previewHeight ? { height: previewHeight } : undefined}
      >
        {variant === "photo" && previewUrl ? (
          <img
            src={previewUrl}
            alt="Screenshot preview"
            className="rm-capture-panel__preview-img"
          />
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

      <div className="rm-input-group">
        <textarea
          className="rm-input-group__textarea"
          placeholder="Add a note (optional)"
          value={additionalText}
          onChange={(e) => setAdditionalText(e.target.value)}
          rows={3}
          onKeyDown={handleKeyDown}
        />
        <div className="rm-input-group__footer">
          <PriorityButton priority={priority} onCycle={setPriority} />
        </div>
      </div>

      <div className="rm-capture-panel__footer">
        {isRecording ? (
          <button
            className="rm-btn rm-btn--primary rm-btn--stop"
            onClick={() => onStopRecording(recordingTime)}
          >
            <StopLine size={20} />
            Stop
          </button>
        ) : (
          <div className="rm-capture-panel__actions">
              <button className="rm-capture-panel__cancel" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="rm-capture-panel__submit"
                onClick={handleSubmit}
              >
                {submitLabel}
              </button>
            </div>
        )}
      </div>
    </div>
  );
}
