import type { ParsedFeedback } from "../server/parse";
import { deriveFeedbackTitle, renderEnvironmentMarkdown, getFileForItem, getHighestPriority, toLinearPriority, priorityTag } from "./shared";

export interface LinearIssuePayload {
  /** Auto-generated issue title. */
  title: string;
  /** Markdown description with feedback details. */
  description: string;
  /** Linear priority integer (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low). */
  priority: number;
  /** Suggested label names based on annotation priorities. */
  labelNames: string[];
  /** Files to upload and embed in the description. */
  files: Array<{ filename: string; content: Blob; placeholder: string }>;
}

/**
 * Format a parsed feedback submission as a Linear issue.
 *
 * Returns a title, markdown description, priority, and files to upload.
 * The developer uploads files to Linear first, replaces placeholders
 * with the returned URLs, then creates the issue.
 *
 * @example
 * ```ts
 * import { toLinearIssue } from "remediate/linear";
 *
 * const issue = toLinearIssue(feedback);
 * // Upload files, replace placeholders, then:
 * await linear.createIssue({
 *   teamId: TEAM_ID,
 *   title: issue.title,
 *   description,
 *   priority: issue.priority,
 * });
 * ```
 */
export function toLinearIssue(feedback: ParsedFeedback): LinearIssuePayload {
  const { submission } = feedback;
  const lines: string[] = [];
  const files: LinearIssuePayload["files"] = [];
  const labelNames = new Set<string>();
  const title = deriveFeedbackTitle(submission.items);
  const highest = getHighestPriority(submission.items);

  // Page
  lines.push(`**Page:** ${submission.url}`);
  lines.push("");

  // Items
  for (const item of submission.items) {
    switch (item.type) {
      case "photo": {
        const placeholder = `{{screenshot-${item.id}}}`;
        lines.push(`**Screenshot**${priorityTag(item.priority)}`);
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
        lines.push(`**Screen Recording** (${item.duration}s)${priorityTag(item.priority)}`);
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
        lines.push(`**Annotation:** \`${item.element.name}\`${priorityTag(item.priority)}`);
        if (item.note) lines.push(`> ${item.note}`);
        lines.push("");
        if (item.priority !== "none") labelNames.add(item.priority);
        break;
      case "textNote":
        lines.push(`**Note**${priorityTag(item.priority)}`);
        lines.push(item.text);
        lines.push("");
        break;
      case "voiceNote": {
        const placeholder = `{{voice-${item.id}}}`;
        lines.push(`**Voice Note** (${item.duration}s)${priorityTag(item.priority)}`);
        lines.push(`*Attached: ${placeholder}*`);
        if (item.additionalText) lines.push(`> ${item.additionalText}`);
        lines.push("");

        const voiceFile = getFileForItem(feedback, item);
        if (voiceFile) {
          files.push({ filename: voiceFile.filename, content: voiceFile.blob, placeholder });
        }
        break;
      }
    }
  }

  // Environment
  lines.push("---");
  lines.push(...renderEnvironmentMarkdown(submission.environment));

  return {
    title,
    description: lines.join("\n"),
    priority: toLinearPriority(highest),
    labelNames: Array.from(labelNames),
    files,
  };
}
