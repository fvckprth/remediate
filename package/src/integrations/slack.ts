import type { ParsedFeedback, ParsedFile } from "../server/parse";

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

  // Header
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: "New Feedback", emoji: true },
  });

  // Page info
  blocks.push({
    type: "section",
    fields: [
      { type: "mrkdwn", text: `*Page:*\n${submission.url}` },
      { type: "mrkdwn", text: `*Time:*\n${submission.timestamp}` },
    ],
  });

  // Environment
  const env = submission.environment;
  blocks.push({
    type: "section",
    fields: [
      { type: "mrkdwn", text: `*Browser:*\n${env.browser.name} ${env.browser.version}` },
      { type: "mrkdwn", text: `*OS:*\n${env.os.name} ${env.os.version}` },
      { type: "mrkdwn", text: `*Viewport:*\n${env.viewport.width}×${env.viewport.height}` },
      { type: "mrkdwn", text: `*Device Pixel Ratio:*\n${env.devicePixelRatio}x` },
    ],
  });

  blocks.push({ type: "divider" });

  // Items summary
  for (const item of submission.items) {
    switch (item.type) {
      case "photo":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Screenshot* — ${Math.round(item.area.width)}×${Math.round(item.area.height)}${item.additionalText ? `\n> ${item.additionalText}` : ""}` },
        });
        break;
      case "video":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Screen Recording* — ${item.duration}s${item.additionalText ? `\n> ${item.additionalText}` : ""}` },
        });
        break;
      case "annotation":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Annotation* — \`${item.element.name}\`${item.priority !== "none" ? ` [${item.priority}]` : ""}${item.note ? `\n> ${item.note}` : ""}` },
        });
        break;
      case "textNote":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Text Note:*\n> ${item.text}` },
        });
        break;
      case "voiceNote":
        blocks.push({
          type: "section",
          text: { type: "mrkdwn", text: `*Voice Note* — ${item.duration}s` },
        });
        break;
    }
  }

  // Collect file uploads
  for (const [, file] of feedback.files) {
    files.push({
      filename: file.filename,
      content: file.blob,
      title: `${file.category} — ${file.itemId}`,
    });
  }

  // Custom metadata
  if (submission.metadata && Object.keys(submission.metadata).length > 0) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "context",
      elements: [
        { type: "mrkdwn", text: `*Metadata:* ${JSON.stringify(submission.metadata)}` },
      ],
    });
  }

  // Fallback text
  const itemCount = submission.items.length;
  const text = `New feedback from ${submission.url} — ${itemCount} item${itemCount !== 1 ? "s" : ""}`;

  return { blocks, text, files };
}
