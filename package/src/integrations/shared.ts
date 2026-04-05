import type { FeedbackItem, AnnotationPriority } from "../types";
import type { ParsedFeedback, ParsedFile } from "../server/parse";

/**
 * Derive a short title from feedback items.
 * Uses the first text note, annotation note, or voice note text, truncated to `maxLen`.
 */
export function deriveFeedbackTitle(items: FeedbackItem[], maxLen = 70): string {
  for (const item of items) {
    if (item.type === "textNote" && item.text.length > 0) {
      return item.text.length > maxLen ? item.text.slice(0, maxLen - 3) + "..." : item.text;
    }
    if (item.type === "annotation" && item.note.length > 0) {
      return item.note.length > maxLen ? item.note.slice(0, maxLen - 3) + "..." : item.note;
    }
    if (item.type === "voiceNote" && item.additionalText.length > 0) {
      return item.additionalText.length > maxLen ? item.additionalText.slice(0, maxLen - 3) + "..." : item.additionalText;
    }
    if (item.type === "photo" && item.additionalText.length > 0) {
      return item.additionalText.length > maxLen ? item.additionalText.slice(0, maxLen - 3) + "..." : item.additionalText;
    }
    if (item.type === "video" && item.additionalText.length > 0) {
      return item.additionalText.length > maxLen ? item.additionalText.slice(0, maxLen - 3) + "..." : item.additionalText;
    }
  }
  return "User Feedback";
}

/**
 * Render environment info as flat, scannable markdown lines.
 */
export function renderEnvironmentMarkdown(env: {
  browser: { name: string; version: string };
  os: { name: string; version: string };
  viewport: { width: number; height: number };
  screen: { width: number; height: number };
  devicePixelRatio: number;
  language: string;
  timezone: string;
  colorScheme: string;
}): string[] {
  return [
    `**Browser:** ${env.browser.name} ${env.browser.version} · ${env.os.name} ${env.os.version}`,
    `**Viewport:** ${env.viewport.width}×${env.viewport.height} · ${env.screen.width}×${env.screen.height} · ${env.devicePixelRatio}x DPR`,
    `**Locale:** ${env.language} · ${env.timezone} · ${env.colorScheme}`,
  ];
}

/**
 * Render environment info as flat, scannable plain text lines.
 */
export function renderEnvironmentText(env: {
  browser: { name: string; version: string };
  os: { name: string; version: string };
  viewport: { width: number; height: number };
  screen: { width: number; height: number };
  devicePixelRatio: number;
  language: string;
  timezone: string;
  colorScheme: string;
}): string[] {
  return [
    `Browser: ${env.browser.name} ${env.browser.version} · ${env.os.name} ${env.os.version}`,
    `Viewport: ${env.viewport.width}×${env.viewport.height} · ${env.screen.width}×${env.screen.height} · ${env.devicePixelRatio}x DPR`,
    `Locale: ${env.language} · ${env.timezone} · ${env.colorScheme}`,
  ];
}

/**
 * Map widget priority to Linear priority integer.
 * Linear: 0=No priority, 1=Urgent, 2=High, 3=Medium, 4=Low
 */
export function toLinearPriority(priority: AnnotationPriority): number {
  switch (priority) {
    case "urgent": return 1;
    case "high": return 2;
    case "medium": return 3;
    case "low": return 4;
    default: return 0;
  }
}

/**
 * Get the highest priority from a list of feedback items.
 */
export function getHighestPriority(items: FeedbackItem[]): AnnotationPriority {
  const order: AnnotationPriority[] = ["urgent", "high", "medium", "low", "none"];
  for (const level of order) {
    if (items.some(i => i.priority === level)) return level;
  }
  return "none";
}

/**
 * Format a priority tag for display, or empty string if none.
 */
export function priorityTag(priority: AnnotationPriority): string {
  if (priority === "none") return "";
  return ` [${priority}]`;
}

/**
 * Get the file associated with a feedback item, if any.
 */
export function getFileForItem(
  feedback: ParsedFeedback,
  item: FeedbackItem,
): ParsedFile | undefined {
  const prefixes: Record<string, string> = {
    photo: "screenshot",
    video: "recording",
    voiceNote: "voice",
  };
  const prefix = prefixes[item.type];
  if (!prefix) return undefined;
  return feedback.files.get(`${prefix}-${item.id}`);
}
