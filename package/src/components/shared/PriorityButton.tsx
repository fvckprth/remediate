import { useCallback } from "react";
import type { AnnotationPriority } from "../../types";

const PRIORITY_OPTIONS: { value: AnnotationPriority; label: string }[] = [
  { value: "none", label: "Set priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const DIM = "rgba(255,255,255,0.2)";
const BAR_COLORS: Record<string, [string, string, string]> = {
  none: [DIM, DIM, DIM],
  low: ["#45ff64", DIM, DIM],
  medium: ["#ffed2d", "#ffed2d", DIM],
  high: ["#ff882d", "#ff882d", "#ff882d"],
};

export function PriorityIcon({ priority }: { priority: AnnotationPriority }) {
  const isUrgent = priority === "urgent";
  const [c1, c2, c3] = BAR_COLORS[priority] ?? BAR_COLORS.none;

  return (
    <div className="rm-priority__icon-wrapper">
      <svg
        className={`rm-priority__icon ${!isUrgent ? "rm-priority__icon--active" : ""}`}
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
      >
        <rect x="3" y="10" width="3" height="4" rx="1.5" fill={c1} style={{ transition: "fill 200ms ease" }} />
        <rect x="7" y="6" width="3" height="8" rx="1.5" fill={c2} style={{ transition: "fill 200ms ease" }} />
        <rect x="11" y="2" width="3" height="12" rx="1.5" fill={c3} style={{ transition: "fill 200ms ease" }} />
      </svg>
      <svg
        className={`rm-priority__icon ${isUrgent ? "rm-priority__icon--active" : ""}`}
        width={16}
        height={16}
        viewBox="0 0 16 16"
        fill="none"
      >
        <circle cx="8" cy="8" r="7" fill="#ff4545" />
        <path d="M8 4.5v4" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="8" cy="11" r="0.9" fill="#fff" />
      </svg>
    </div>
  );
}

interface PriorityButtonProps {
  priority: AnnotationPriority;
  onCycle: (next: AnnotationPriority) => void;
}

export function PriorityButton({ priority, onCycle }: PriorityButtonProps) {
  const cyclePriority = useCallback(() => {
    const currentIdx = PRIORITY_OPTIONS.findIndex((p) => p.value === priority);
    const nextIdx = (currentIdx + 1) % PRIORITY_OPTIONS.length;
    onCycle(PRIORITY_OPTIONS[nextIdx].value);
  }, [priority, onCycle]);

  return (
    <button
      className={`rm-priority rm-priority--${priority}`}
      onClick={cyclePriority}
      type="button"
    >
      <PriorityIcon priority={priority} />
      <div className="rm-priority__labels">
        {PRIORITY_OPTIONS.map((p) => (
          <span
            key={p.value}
            className={`rm-priority__label ${p.value === priority ? "rm-priority__label--active" : ""}`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </button>
  );
}
