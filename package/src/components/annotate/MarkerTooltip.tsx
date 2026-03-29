interface MarkerTooltipProps {
  descriptor: string;
  note: string;
  top: number;
  left: number;
}

export function MarkerTooltip({ descriptor, note, top, left }: MarkerTooltipProps) {
  if (!note) return null;

  return (
    <div
      className="rm-marker-tooltip"
      data-remediate-widget=""
      style={{ top, left }}
    >
      <div className="rm-marker-tooltip__descriptor">{descriptor}</div>
      <div className="rm-marker-tooltip__note">{note}</div>
    </div>
  );
}
