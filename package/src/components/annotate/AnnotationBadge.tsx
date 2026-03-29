import { useState } from "react";

interface AnnotationBadgeProps {
  index: number;
  rect: DOMRect;
  clickOffset: { x: number; y: number };
  color: string;
  onClick: () => void;
  variant?: "pending" | "numbered" | "multi-pending";
}

export function AnnotationBadge({ index, rect, clickOffset, color, onClick, variant = "numbered" }: AnnotationBadgeProps) {
  const isMulti = variant === "multi-pending";
  const isPending = variant === "pending" || isMulti;
  const half = isMulti ? 13 : 11;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`rm-badge-wrap${isMulti ? " rm-badge-wrap--multi" : ""}`}
      style={{
        top: rect.top + clickOffset.y - half,
        left: rect.left + clickOffset.x - half,
      }}
    >
      <button
        className={`rm-badge${isMulti ? " rm-badge--multi" : ""}`}
        style={{ background: isMulti ? "#22c55e" : color }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={isPending ? "Pending annotation" : `Annotation ${index}`}
      >
        {isPending ? (
          <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 20a1 1 0 1 0 2 0v-7h7a1 1 0 1 0 0-2h-7V4a1 1 0 1 0-2 0v7H4a1 1 0 1 0 0 2h7z" />
          </svg>
        ) : hovered ? (
          <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.138 4.538a2 2 0 0 1 2.031.328l.126.115 4.724 4.724a2 2 0 0 1 .5 1.997l-.057.16-2.365 5.913a2 2 0 0 1-1.605 1.24l-5.079.635q-.196.023-.41.056l-.444.072-.232.042-.723.14-.495.106-.745.167-.955.228-1.552.396-.646.174a1.01 1.01 0 0 1-1.265-1.134l.034-.146.295-1.112.264-1.048.228-.955.167-.745.105-.496.141-.722.08-.457.064-.428.66-5.28a2 2 0 0 1 1.09-1.536l.151-.069zm.742 1.857L6.968 8.76l-.584 4.672-.048.396a27 27 0 0 1-.385 2.192l-.171.786 3.288-3.288a2 2 0 1 1 1.414 1.414L7.194 18.22l.392-.087.784-.165a28 28 0 0 1 1.473-.26l5.397-.676 2.365-5.912z" />
            <path d="m15.243 3.101a1 1 0 0 1 1.32-.084l.094.084 4.242 4.242a1 1 0 0 1-1.32 1.498l-.094-.084-4.242-4.242a1 1 0 0 1 0-1.414" />
          </svg>
        ) : (
          index
        )}
      </button>
    </div>
  );
}
