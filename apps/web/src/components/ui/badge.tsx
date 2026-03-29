const typeStyles: Record<string, string> = {
  text: "bg-surface text-foreground",
  photo: "bg-surface text-foreground",
  video: "bg-surface text-foreground",
  voiceNote: "bg-surface text-foreground",
  annotation: "bg-surface text-foreground",
};

export function Badge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border border-border ${typeStyles[type] ?? "bg-surface text-muted"}`}
    >
      {type}
    </span>
  );
}
