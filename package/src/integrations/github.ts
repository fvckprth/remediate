import type { ParsedFeedback } from "../server/parse";
import { deriveFeedbackTitle, renderEnvironmentMarkdown, getFileForItem, priorityTag, summarizeItem, type FeedbackFile } from "./shared";

export interface GithubIssuePayload {
  /** Auto-generated issue title. */
  title: string;
  /** Markdown body for the issue. */
  body: string;
  /** Suggested labels based on feedback content. */
  labels: string[];
  /** Files to upload. Developer uploads via GitHub API, then replaces placeholders in body. */
  files: FeedbackFile[];
}

/**
 * Format a parsed feedback submission as a GitHub issue.
 *
 * @example
 * ```ts
 * import { toGithubIssue } from "remediate/github";
 *
 * const issue = toGithubIssue(feedback);
 * // Upload files, replace placeholders, then:
 * // await octokit.issues.create({ owner, repo, title: issue.title, body: issue.body, labels: issue.labels });
 * ```
 */
export function toGithubIssue(feedback: ParsedFeedback): GithubIssuePayload {
  const { submission } = feedback;
  const lines: string[] = [];
  const files: GithubIssuePayload["files"] = [];
  const labels = ["feedback"];
  const title = deriveFeedbackTitle(submission.items);

  lines.push(`**Page:** ${submission.url}`);
  lines.push("");

  for (const item of submission.items) {
    const s = summarizeItem(item);
    const heading = s.elementName ? `**${s.label}:** \`${s.elementName}\`` : `**${s.label}**`;

    lines.push(`${heading}${priorityTag(s.priority)}`);

    if (s.filePrefix) {
      const placeholder = `{{${s.filePrefix}-${s.itemId}}}`;
      if (s.filePrefix === "screenshot") lines.push(`![screenshot](${placeholder})`);
      else lines.push(`[Download ${s.filePrefix}](${placeholder})`);

      const file = getFileForItem(feedback, item);
      if (file) files.push({ filename: file.filename, content: file.blob, contentType: file.type, placeholder, title: file.filename });
    }

    if (s.text) {
      lines.push(s.filePrefix ? `> ${s.text}` : s.text);
    }

    lines.push("");
    if (s.priority !== "none" && s.elementName) labels.push(s.priority);
  }

  lines.push("---");
  lines.push(...renderEnvironmentMarkdown(submission.environment));

  return {
    title,
    body: lines.join("\n"),
    labels: [...new Set(labels)],
    files,
  };
}
