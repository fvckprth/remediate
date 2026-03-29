"use client";

const UNITS: [string, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";

  for (const [unit, value] of UNITS) {
    const count = Math.floor(seconds / value);
    if (count >= 1) {
      return `${count}${unit.charAt(0)} ago`;
    }
  }
  return "just now";
}

export function RelativeTime({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <time dateTime={d.toISOString()} title={d.toLocaleString()}>
      {timeAgo(d)}
    </time>
  );
}
