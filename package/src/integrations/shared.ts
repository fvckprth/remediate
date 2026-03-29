import type { FeedbackItem } from "../types";
import type { ParsedFeedback, ParsedFile } from "../server/parse";

/**
 * Derive a short title from feedback items.
 * Uses the first text note or annotation note, truncated to `maxLen`.
 */
export function deriveFeedbackTitle(items: FeedbackItem[], maxLen = 70): string {
  for (const item of items) {
    if (item.type === "textNote" && item.text.length > 0) {
      return item.text.length > maxLen ? item.text.slice(0, maxLen - 3) + "..." : item.text;
    }
    if (item.type === "annotation" && item.note.length > 0) {
      return item.note.length > maxLen ? item.note.slice(0, maxLen - 3) + "..." : item.note;
    }
  }
  return "User Feedback";
}

/**
 * Render environment info as a markdown details/table block.
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
    "<details><summary>Environment</summary>",
    "",
    "| Property | Value |",
    "|----------|-------|",
    `| Browser | ${env.browser.name} ${env.browser.version} |`,
    `| OS | ${env.os.name} ${env.os.version} |`,
    `| Viewport | ${env.viewport.width}\u00d7${env.viewport.height} |`,
    `| Screen | ${env.screen.width}\u00d7${env.screen.height} |`,
    `| DPR | ${env.devicePixelRatio}x |`,
    `| Language | ${env.language} |`,
    `| Timezone | ${env.timezone} |`,
    `| Color Scheme | ${env.colorScheme} |`,
    "",
    "</details>",
  ];
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
