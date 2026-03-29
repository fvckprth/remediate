import type { ParsedFeedback } from "../server/parse";
import { deriveFeedbackTitle, renderEnvironmentMarkdown, getFileForItem } from "./shared";

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

  // Page info
  lines.push(`**Page:** ${submission.url}`);
  lines.push(`**Time:** ${submission.timestamp}`);
  lines.push("");

  // Environment (collapsed)
  lines.push(...renderEnvironmentMarkdown(submission.environment));
  lines.push("");

  // Items
  lines.push("## Feedback");
  lines.push("");

  for (const item of submission.items) {
    switch (item.type) {
      case "photo": {
        const placeholder = `{{screenshot-${item.id}}}`;
        lines.push(`### Screenshot (${Math.round(item.area.width)}×${Math.round(item.area.height)})`);
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
        lines.push(`### Screen Recording (${item.duration}s)`);
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
        lines.push(`### Annotation: \`${item.element.name}\``);
        if (item.priority !== "none") {
          lines.push(`**Priority:** ${item.priority}`);
          labels.push(item.priority);
        }
        if (item.note) lines.push(`> ${item.note}`);
        lines.push("");
        lines.push("<details><summary>Element details</summary>");
        lines.push("");
        lines.push(`- **Selector:** \`${item.element.selector}\``);
        lines.push(`- **Path:** \`${item.element.elementPath}\``);
        lines.push("");
        lines.push("</details>");
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
        lines.push(`[Download voice note](${placeholder})`);
        lines.push("");

        const voiceFile = getFileForItem(feedback, item);
        if (voiceFile) {
          files.push({ filename: voiceFile.filename, content: voiceFile.blob, placeholder });
        }
        break;
      }
    }
  }

  return {
    title,
    body: lines.join("\n"),
    labels: [...new Set(labels)],
    files,
  };
}
