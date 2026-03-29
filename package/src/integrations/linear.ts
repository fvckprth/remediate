import type { ParsedFeedback } from "../server/parse";
import { deriveFeedbackTitle, renderEnvironmentMarkdown, getFileForItem } from "./shared";

export interface LinearIssuePayload {
  /** Auto-generated issue title. */
  title: string;
  /** Markdown description with feedback details. */
  description: string;
  /** Suggested label names based on annotation priorities. */
  labelNames: string[];
  /** Files to upload and embed in the description. */
  files: Array<{ filename: string; content: Blob; placeholder: string }>;
}

/**
 * Format a parsed feedback submission as a Linear issue.
 *
 * Returns a title, markdown description, and files to upload.
 * The developer uploads files to Linear first, replaces placeholders
 * with the returned URLs, then creates the issue.
 *
 * @example
 * ```ts
 * import { toLinearIssue } from "remediate/linear";
 *
 * const issue = toLinearIssue(feedback);
 * // Upload files to Linear, replace placeholders in issue.description
 * // Then create the issue via Linear SDK
 * ```
 */
export function toLinearIssue(feedback: ParsedFeedback): LinearIssuePayload {
  const { submission } = feedback;
  const lines: string[] = [];
  const files: LinearIssuePayload["files"] = [];
  const labelNames = new Set<string>();
  const title = deriveFeedbackTitle(submission.items);

  // Page info
  lines.push(`**Page:** ${submission.url}`);
  lines.push(`**Time:** ${submission.timestamp}`);
  lines.push("");

  // Environment
  lines.push(...renderEnvironmentMarkdown(submission.environment));
  lines.push("");

  // Items
  lines.push("## Feedback Items");
  lines.push("");

  for (const item of submission.items) {
    switch (item.type) {
      case "photo": {
        const placeholder = `{{screenshot-${item.id}}}`;
        lines.push(`### Screenshot (${Math.round(item.area.width)}×${Math.round(item.area.height)})`);
        lines.push(placeholder);
        if (item.additionalText) lines.push(`> ${item.additionalText}`);
        lines.push("");

        const photoFile = getFileForItem(feedback, item);
        if (photoFile) {
          files.push({ filename: photoFile.filename, content: photoFile.blob, placeholder });
        }
        break;
      }
      case "video": {
        const placeholder = `{{recording-${item.id}}}`;
        lines.push(`### Screen Recording (${item.duration}s)`);
        lines.push(`*Attached: ${placeholder}*`);
        if (item.additionalText) lines.push(`> ${item.additionalText}`);
        lines.push("");

        const videoFile = getFileForItem(feedback, item);
        if (videoFile) {
          files.push({ filename: videoFile.filename, content: videoFile.blob, placeholder });
        }
        break;
      }
      case "annotation":
        lines.push(`### Annotation — \`${item.element.name}\``);
        if (item.priority !== "none") {
          lines.push(`**Priority:** ${item.priority}`);
          labelNames.add(item.priority);
        }
        if (item.note) lines.push(`> ${item.note}`);
        lines.push(`**Selector:** \`${item.element.selector}\``);
        lines.push("");
        break;
      case "textNote":
        lines.push(`### Note`);
        lines.push(item.text);
        lines.push("");
        break;
      case "voiceNote": {
        const placeholder = `{{voice-${item.id}}}`;
        lines.push(`### Voice Note (${item.duration}s)`);
        lines.push(`*Attached: ${placeholder}*`);
        lines.push("");

        const voiceFile = getFileForItem(feedback, item);
        if (voiceFile) {
          files.push({ filename: voiceFile.filename, content: voiceFile.blob, placeholder });
        }
        break;
      }
    }
  }

  // Custom metadata
  if (submission.metadata && Object.keys(submission.metadata).length > 0) {
    lines.push("---");
    lines.push(`**Metadata:** \`${JSON.stringify(submission.metadata)}\``);
  }

  return {
    title,
    description: lines.join("\n"),
    labelNames: Array.from(labelNames),
    files,
  };
}
