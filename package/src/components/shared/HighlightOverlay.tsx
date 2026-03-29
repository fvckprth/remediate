interface HighlightOverlayProps {
  rect: DOMRect;
  color: string;
  variant: "hover" | "persistent" | "multi-pending";
}

export function HighlightOverlay({ rect, color, variant }: HighlightOverlayProps) {
  const fillOpacity = variant === "hover" ? 0.06 : variant === "multi-pending" ? 0.05 : 0.08;

  return (
    <div
      className={`rm-highlight rm-highlight--${variant}`}
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderColor: color,
        backgroundColor: `${color}${Math.round(fillOpacity * 255).toString(16).padStart(2, "0")}`,
      }}
    />
  );
}
