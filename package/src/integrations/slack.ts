import type { ParsedFeedback, ParsedFile } from "../server/parse";
import { deriveFeedbackTitle, priorityTag } from "./shared";

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string; emoji?: boolean };
  elements?: Array<{ type: string; text: string; emoji?: boolean }>;
  fields?: Array<{ type: string; text: string }>;
  image_url?: string;
  alt_text?: string;
  title?: { type: string; text: string };
}

export interface SlackFileUpload {
  filename: string;
  content: Blob;
  title: string;
}

export interface SlackMessagePayload {
  /** Slack Block Kit blocks for the message. */
  blocks: SlackBlock[];
  /** Plain text fallback for notifications. */
  text: string;
  /** Files to upload alongside the message (screenshots, videos, voice notes). */
  files: SlackFileUpload[];
}

/**
 * Format a parsed feedback submission as a Slack message.
 *
 * Returns Block Kit blocks + file upload payloads. The developer
 * handles the actual Slack API call with their own token.
 *
 * @example
 * ```ts
 * import { toSlackMessage } from "remediate/slack";
 * import { WebClient } from "@slack/web-api";
 *
 * const slack = new WebClient(process.env.SLACK_TOKEN);
 * const msg = toSlackMessage(feedback);
 *
 * await slack.chat.postMessage({ channel: "#feedback", blocks: msg.blocks, text: msg.text });
 * for (const file of msg.files) {
 *   await slack.filesUploadV2({ channel_id: "C...", file: file.content, filename: file.filename, title: file.title });
 * }
 * ```
 */
export function toSlackMessage(feedback: ParsedFeedback): SlackMessagePayload {
  const { submission } = feedback;
  const blocks: SlackBlock[] = [];
  const files: SlackFileUpload[] = [];
  const env = submission.environment;

  const title = deriveFeedbackTitle(submission.items);

  // Title
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: title, emoji: true },
  });

  // Page
  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: `*Page:* ${submission.url}` },
  });

  blocks.push({ type: "divider" });

  // Items
  for (const item of submission.items) {
    switch (item.type) {
      case "photo":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Screenshot*${priorityTag(item.priority)}${item.additionalText ? `\n${item.additionalText}` : ""}` },
        });
        break;
      case "video":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Screen Recording* (${item.duration}s)${priorityTag(item.priority)}${item.additionalText ? `\n${item.additionalText}` : ""}` },
        });
        break;
      case "annotation":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Annotation:* \`${item.element.name}\`${priorityTag(item.priority)}${item.note ? `\n${item.note}` : ""}` },
        });
        break;
      case "textNote":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Note*${priorityTag(item.priority)}\n${item.text}` },
        });
        break;
      case "voiceNote":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Voice Note* (${item.duration}s)${priorityTag(item.priority)}${item.additionalText ? `\n${item.additionalText}` : ""}` },
        });
        break;
    }
  }

  // Environment
  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: `${env.browser.name} ${env.browser.version} · ${env.os.name} ${env.os.version} · ${env.viewport.width}×${env.viewport.height} · ${env.devicePixelRatio}x DPR · ${env.language} · ${env.timezone} · ${env.colorScheme}` },
    ],
  });

  // Collect file uploads
  for (const [, file] of feedback.files) {
    files.push({
      filename: file.filename,
      content: file.blob,
      title: `${file.category} — ${file.itemId}`,
    });
  }

  // Fallback text
  const itemCount = submission.items.length;
  const text = `${title} — ${submission.url} (${itemCount} item${itemCount !== 1 ? "s" : ""})`;

  return { blocks, text, files };
}
