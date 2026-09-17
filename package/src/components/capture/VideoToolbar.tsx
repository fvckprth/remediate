import type { SelectionArea } from "../../types";
import { StopLine } from "../icons";
import { useElapsedSeconds } from "../../hooks/useElapsedSeconds";
import { formatClock } from "../../utils/time";

interface VideoToolbarProps {
  area: SelectionArea | null;
  isReady: boolean;
  onStopRecording: (duration: number) => void;
}

/** Recording timer + stop control shown while a screen recording is in progress. Escape is handled by useWidgetKeyboard. */
export function VideoToolbar({ area, isReady, onStopRecording }: VideoToolbarProps) {
  const recordingTime = useElapsedSeconds(isReady);

  if (!isReady) return null;

  // Position the recording bar below the selected area, centered
  const barStyle: React.CSSProperties = area
    ? { left: area.x + area.width / 2, top: area.y + area.height + 12 }
    : { bottom: 40, left: "50%" };

  return (
    <div data-remediate-widget="" style={{ pointerEvents: "none" }}>
      {area && (
        <div
          className="rm-video-area-dim"
          style={{
            clipPath: `polygon(
              0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
              ${area.x}px ${area.y}px,
              ${area.x}px ${area.y + area.height}px,
              ${area.x + area.width}px ${area.y + area.height}px,
              ${area.x + area.width}px ${area.y}px,
              ${area.x}px ${area.y}px
            )`,
          }}
        />
      )}

      <div className="rm-video-recording-bar" role="status" style={{ ...barStyle, pointerEvents: "auto" }}>
        <span className="rm-video-recording-bar__timer">{formatClock(recordingTime)}</span>
        <button
          type="button"
          className="rm-video-recording-bar__stop"
          aria-label="Stop recording"
          onClick={() => onStopRecording(recordingTime)}
        >
          <StopLine size={20} />
        </button>
      </div>
    </div>
  );
}
