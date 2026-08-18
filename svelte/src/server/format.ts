import type {
  FeedbackSubmission,
  FeedbackItem,
  AnnotationItem,
  ElementCapture,
  PhotoCapture,
  VideoCapture,
  VoiceNoteItem,
  TextNoteItem,
} from "../types";
import { fileKey, fileName } from "../utils/file-keys";

export interface ToMarkdownOptions {
  /** Map of file key → public URL. Keys match FormData field names (e.g. "screenshot-cap_abc123"). */
  fileUrls?: Record<string, string>;
  /** Include the environment line at the bottom (default: true). */
  environment?: boolean;
  /** Include metadata as a fenced JSON block (default: false — may contain sensitive data). */
  metadata?: boolean;
}

/**
 * Format a FeedbackSubmission as structured markdown.
 *
 * Works as-is for GitHub Issues, Linear, Discord embeds, and email.
 * Pass `fileUrls` to embed screenshots inline and link recordings/voice notes.
 *
 * @example
 * ```ts
 * import { parseFeedback, toMarkdown } from "remediate/server";
 *
 * export async function POST(req: Request) {
 *   const { submission } = await parseFeedback(req);
 *   const body = toMarkdown(submission);
 *   // send `body` to github, discord, linear, email, etc.
 * }
 * ```
 */
export function toMarkdown(
  submission: FeedbackSubmission,
  options?: ToMarkdownOptions,
): string {
  const { fileUrls, environment = true, metadata = false } = options ?? {};
  const lines: string[] = [];

  const path = extractPath(submission.url);
  lines.push(`**Feedback on ${path}**`);

  if (needsSummaryLine(submission.items)) {
    lines.push(buildSummary(submission.items));
  }
  lines.push(formatDate(submission.timestamp), "");

  const annotations = submission.items.filter(
    (i): i is AnnotationItem => i.type === "annotation",
  );
  const textNotes = submission.items.filter(
    (i): i is TextNoteItem => i.type === "textNote",
  );
  const captures = submission.items.filter(
    (i): i is PhotoCapture | VideoCapture | VoiceNoteItem =>
      i.type === "photo" || i.type === "video" || i.type === "voiceNote",
  );

  const showHeaders = needsSectionHeaders(annotations, textNotes, captures);
  const sections: string[] = [];

  if (annotations.length > 0) {
    sections.push(renderAnnotations(annotations, showHeaders));
  }
  if (textNotes.length > 0) {
    sections.push(renderTextNotes(textNotes, showHeaders));
  }
  if (captures.length > 0) {
    sections.push(renderCaptures(captures, showHeaders, fileUrls));
  }

  lines.push(sections.join("\n\n"));

  if (environment) {
    lines.push("", formatEnvironment(submission.environment));
  }

  if (metadata && Object.keys(submission.metadata).length > 0) {
    lines.push("", "**Metadata**", "");
    lines.push("```json", JSON.stringify(submission.metadata, null, 2), "```");
  }

  return lines.join("\n");
}

// --- section renderers ---

function renderAnnotations(items: AnnotationItem[], showHeader: boolean): string {
  const lines: string[] = [];
  if (showHeader) lines.push("**Annotations**", "");
  for (const item of items) {
    const priority =
      item.priority !== "none" ? ` · **${item.priority}**` : "";
    lines.push(`**#${item.index}** · \`${truncateSelector(item.element)}\`${priority}`);
    if (item.note) {
      lines.push(`> ${item.note}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderTextNotes(items: TextNoteItem[], showHeader: boolean): string {
  const lines: string[] = [];
  if (showHeader) lines.push("**Text notes**", "");
  for (const item of items) {
    const priority =
      item.priority !== "none" ? ` · **${item.priority}**` : "";
    lines.push(`**#${item.index}**${priority}`);
    if (item.text) {
      lines.push(`> ${item.text}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function renderCaptures(
  items: (PhotoCapture | VideoCapture | VoiceNoteItem)[],
  showHeader: boolean,
  fileUrls?: Record<string, string>,
): string {
  const lines: string[] = [];
  if (showHeader) lines.push("**Captures**", "");
  for (const item of items) {
    const label = captureLabel(item);
    const duration = "duration" in item ? ` · ${Math.round(item.duration)}s` : "";
    const key = fileKey(item);
    const name = fileName(item);
    const url = key && fileUrls?.[key];

    if (url && item.type === "photo") {
      lines.push(`**#${item.index}** · ${label}${duration}`);
      lines.push(`![${name}](${url})`);
    } else if (url) {
      lines.push(`**#${item.index}** · ${label}${duration}`);
      lines.push(`[${name}](${url})`);
    } else if (name) {
      lines.push(`**#${item.index}** · ${label}${duration} · ${name}`);
    } else {
      lines.push(`**#${item.index}** · ${label}${duration}`);
    }

    if (item.additionalText) {
      lines.push(`> ${item.additionalText}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

// --- helpers ---

function truncateSelector(el: ElementCapture): string {
  if (el.componentChain && el.componentChain.length > 0) {
    const display = el.componentChain.slice(0, 3).reverse();
    return display.join(" > ");
  }

  const sel = el.selector;
  if (sel.length <= 50 && !sel.includes("nth-of-type") && !sel.includes("nth-child")) {
    return sel;
  }

  if (el.elementPath) {
    return el.elementPath;
  }

  const segments = sel.split(" > ");
  if (segments.length <= 3) return sel;
  return "… > " + segments.slice(-3).join(" > ");
}

function needsSectionHeaders(
  annotations: AnnotationItem[],
  textNotes: TextNoteItem[],
  captures: (PhotoCapture | VideoCapture | VoiceNoteItem)[],
): boolean {
  const populated = [annotations, textNotes, captures].filter(a => a.length > 0).length;
  const total = annotations.length + textNotes.length + captures.length;
  return total >= 4 && populated >= 2;
}

function needsSummaryLine(items: FeedbackItem[]): boolean {
  if (items.length <= 2) {
    const types = new Set(items.map(i => i.type));
    if (types.size <= 1) return false;
  }
  return true;
}

function extractPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function buildSummary(items: FeedbackItem[]): string {
  const total = items.length;
  const counts: Record<string, number> = {};
  for (const item of items) {
    const label = typeLabel(item.type);
    counts[label] = (counts[label] || 0) + 1;
  }
  const parts = Object.entries(counts).map(
    ([label, count]) => `${count} ${label}${count > 1 ? "s" : ""}`,
  );
  const itemWord = total === 1 ? "item" : "items";
  return `**${total} ${itemWord}** · ${parts.join(", ")}`;
}

function typeLabel(type: string): string {
  switch (type) {
    case "annotation":
      return "annotation";
    case "textNote":
      return "text note";
    case "photo":
      return "photo";
    case "video":
      return "video";
    case "voiceNote":
      return "voice note";
    default:
      return type;
  }
}

function captureLabel(item: PhotoCapture | VideoCapture | VoiceNoteItem): string {
  return typeLabel(item.type);
}

function formatDate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return timestamp;
  }
}

function formatEnvironment(env: FeedbackSubmission["environment"]): string {
  const parts = [
    `${env.browser.name} ${env.browser.version}`,
    `${env.os.name} ${env.os.version}`,
    `${env.viewport.width}×${env.viewport.height}`,
    `${env.devicePixelRatio}x`,
    env.language,
    env.colorScheme,
  ];
  return parts.join(" · ");
}
