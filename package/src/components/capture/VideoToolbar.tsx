import { useState, useEffect, useRef } from "react";
import type { SelectionArea } from "../../types";
import { StopLine } from "../icons";

interface VideoToolbarProps {
  area: SelectionArea | null;
  isReady: boolean;
  onStopRecording: (duration: number) => void;
  onCancel: () => void;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoToolbar({
  area,
  isReady,
  onStopRecording,
  onCancel,
}: VideoToolbarProps) {
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isReady) {
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isReady]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  // Position the recording bar below the selected area, centered
  const barStyle: React.CSSProperties = area
    ? {
        position: "fixed",
        left: area.x + area.width / 2,
        top: area.y + area.height + 12,
        transform: "translateX(-50%)",
        zIndex: 999999,
      }
    : {
        position: "fixed",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999999,
      };

  return (
    <div data-remediate-widget="" style={{ pointerEvents: "none" }}>
      {area && (
        <div
          className="rm-video-area-highlight"
          style={{
            left: area.x,
            top: area.y,
            width: area.width,
            height: area.height,
          }}
        />
      )}

      <div className="rm-video-recording-bar" style={{ ...barStyle, pointerEvents: "auto" }}>
        <span className="rm-video-recording-bar__timer">
          {isReady ? formatDuration(recordingTime) : "Waiting\u2026"}
        </span>
        <span className="rm-video-recording-bar__divider" />
        <button
          className="rm-video-recording-bar__stop"
          aria-label="Stop recording"
          disabled={!isReady}
          onClick={() => onStopRecording(recordingTime)}
        >
          <StopLine size={20} />
        </button>
      </div>
    </div>
  );
}
