import { useState } from "react";
import { AddLine, PenFill } from "../icons";

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
        type="button"
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
          <AddLine size={12} />
        ) : hovered ? (
          <PenFill size={12} />
        ) : (
          index
        )}
      </button>
    </div>
  );
}
