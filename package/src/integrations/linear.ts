import type { ParsedFeedback } from "../server/parse";
import { deriveFeedbackTitle, renderEnvironmentMarkdown, getFileForItem, getHighestPriority, toLinearPriority, priorityTag, summarizeItem, type FeedbackFile } from "./shared";

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
  files: FeedbackFile[];
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

  lines.push(`**Page:** ${submission.url}`);
  lines.push("");

  for (const item of submission.items) {
    const s = summarizeItem(item);
    const heading = s.elementName ? `**${s.label}:** \`${s.elementName}\`` : `**${s.label}**`;

    lines.push(`${heading}${priorityTag(s.priority)}`);

    if (s.filePrefix) {
      const placeholder = `{{${s.filePrefix}-${s.itemId}}}`;
      if (s.filePrefix === "screenshot") lines.push(placeholder);
      else lines.push(`*Attached: ${placeholder}*`);

      const file = getFileForItem(feedback, item);
      if (file) files.push({ filename: file.filename, content: file.blob, contentType: file.type, placeholder, title: file.filename });
    }

    if (s.text) {
      lines.push(s.filePrefix ? `> ${s.text}` : s.text);
    }

    lines.push("");
    if (s.priority !== "none" && s.elementName) labelNames.add(s.priority);
  }

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
