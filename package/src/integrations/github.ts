import type { ParsedFeedback } from "../server/parse";
import { deriveFeedbackTitle, renderEnvironmentMarkdown, getFileForItem, priorityTag } from "./shared";

export interface GithubIssuePayload {
  /** Auto-generated issue title. */
  title: string;
  /** Markdown body for the issue. */
  body: string;
  /** Suggested labels based on feedback content. */
  labels: string[];
  /** Files to upload. Developer uploads via GitHub API, then replaces placeholders in body. */
  files: Array<{ filename: string; content: Blob; placeholder: string }>;
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

  // Page
  lines.push(`**Page:** ${submission.url}`);
  lines.push("");

  // Items
  for (const item of submission.items) {
    switch (item.type) {
      case "photo": {
        const placeholder = `{{screenshot-${item.id}}}`;
        lines.push(`**Screenshot**${priorityTag(item.priority)}`);
        lines.push(`![screenshot](${placeholder})`);
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
        lines.push(`[Download recording](${placeholder})`);
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
        if (item.priority !== "none") labels.push(item.priority);
        break;
      case "textNote":
        lines.push(`**Note**${priorityTag(item.priority)}`);
        lines.push(item.text);
        lines.push("");
        break;
      case "voiceNote": {
        const placeholder = `{{voice-${item.id}}}`;
        lines.push(`**Voice Note** (${item.duration}s)${priorityTag(item.priority)}`);
        lines.push(`[Download voice note](${placeholder})`);
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
    body: lines.join("\n"),
    labels: [...new Set(labels)],
    files,
  };
}
