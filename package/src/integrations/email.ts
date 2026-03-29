import type { ParsedFeedback } from "../server/parse";
import type { AnnotationPriority } from "../types";
import { deriveFeedbackTitle } from "./shared";

export interface EmailAttachment {
  filename: string;
  content: Blob;
  contentType: string;
}

export interface EmailPayload {
  /** Email subject line. */
  subject: string;
  /** HTML email body. */
  html: string;
  /** Plain text email body. */
  text: string;
  /** File attachments (screenshots, videos, voice notes). */
  attachments: EmailAttachment[];
}

/**
 * Format feedback as an email payload.
 *
 * Works with any email service (Resend, SendGrid, Nodemailer, etc.).
 *
 * @example
 * ```ts
 * import { toEmail } from "remediate/email";
 * import { Resend } from "resend";
 *
 * const resend = new Resend(process.env.RESEND_KEY);
 * const email = toEmail(feedback);
 * await resend.emails.send({
 *   from: "feedback@yourapp.com",
 *   to: "team@yourapp.com",
 *   subject: email.subject,
 *   html: email.html,
 *   attachments: email.attachments.map(a => ({
 *     filename: a.filename,
 *     content: Buffer.from(await a.content.arrayBuffer()),
 *   })),
 * });
 * ```
 */
export function toEmail(feedback: ParsedFeedback): EmailPayload {
  const { submission } = feedback;
  const env = submission.environment;
  const attachments: EmailAttachment[] = [];

  // Subject
  const derived = deriveFeedbackTitle(submission.items, 60);
  const subject = derived === "User Feedback"
    ? `Feedback from ${new URL(submission.url).pathname}`
    : derived;

  // Plain text
  const textLines: string[] = [];
  textLines.push(`Feedback from: ${submission.url}`);
  textLines.push(`Time: ${submission.timestamp}`);
  textLines.push(`Browser: ${env.browser.name} ${env.browser.version}`);
  textLines.push(`OS: ${env.os.name} ${env.os.version}`);
  textLines.push(`Viewport: ${env.viewport.width}x${env.viewport.height}`);
  textLines.push("");

  for (const item of submission.items) {
    switch (item.type) {
      case "photo":
        textLines.push(`[Screenshot: ${Math.round(item.area.width)}x${Math.round(item.area.height)}]`);
        if (item.additionalText) textLines.push(`  ${item.additionalText}`);
        break;
      case "video":
        textLines.push(`[Screen Recording: ${item.duration}s]`);
        if (item.additionalText) textLines.push(`  ${item.additionalText}`);
        break;
      case "annotation":
        textLines.push(`[Annotation: ${item.element.name}]${item.priority !== "none" ? ` [${item.priority}]` : ""}`);
        if (item.note) textLines.push(`  ${item.note}`);
        break;
      case "textNote":
        textLines.push(item.text);
        break;
      case "voiceNote":
        textLines.push(`[Voice Note: ${item.duration}s]`);
        break;
    }
    textLines.push("");
  }

  // HTML
  const htmlParts: string[] = [];
  htmlParts.push(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">`);
  htmlParts.push(`<h2 style="margin: 0 0 16px;">New Feedback</h2>`);
  htmlParts.push(`<p style="color: #666; margin: 4px 0;"><strong>Page:</strong> <a href="${escapeHtml(submission.url)}">${escapeHtml(submission.url)}</a></p>`);
  htmlParts.push(`<p style="color: #666; margin: 4px 0;"><strong>Time:</strong> ${escapeHtml(submission.timestamp)}</p>`);
  htmlParts.push(`<p style="color: #666; margin: 4px 0;"><strong>Browser:</strong> ${escapeHtml(env.browser.name)} ${escapeHtml(env.browser.version)} · ${escapeHtml(env.os.name)} ${escapeHtml(env.os.version)}</p>`);
  htmlParts.push(`<p style="color: #666; margin: 4px 0;"><strong>Viewport:</strong> ${env.viewport.width}×${env.viewport.height}</p>`);
  htmlParts.push(`<hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />`);

  for (const item of submission.items) {
    switch (item.type) {
      case "photo":
        htmlParts.push(`<div style="margin: 12px 0;"><strong>Screenshot</strong> (${Math.round(item.area.width)}×${Math.round(item.area.height)})`);
        if (item.additionalText) htmlParts.push(`<p style="color: #666; margin: 4px 0;">${escapeHtml(item.additionalText)}</p>`);
        htmlParts.push(`<p style="color: #999; font-size: 13px;">See attachment: screenshot-${escapeHtml(item.id)}.png</p></div>`);
        break;
      case "video":
        htmlParts.push(`<div style="margin: 12px 0;"><strong>Screen Recording</strong> (${item.duration}s)`);
        if (item.additionalText) htmlParts.push(`<p style="color: #666; margin: 4px 0;">${escapeHtml(item.additionalText)}</p>`);
        htmlParts.push(`<p style="color: #999; font-size: 13px;">See attachment: recording-${escapeHtml(item.id)}.webm</p></div>`);
        break;
      case "annotation":
        htmlParts.push(`<div style="margin: 12px 0;"><strong>Annotation:</strong> <code>${escapeHtml(item.element.name)}</code>`);
        if (item.priority !== "none") htmlParts.push(` <span style="color: ${priorityColor(item.priority)}; font-weight: 600;">[${escapeHtml(item.priority)}]</span>`);
        if (item.note) htmlParts.push(`<p style="color: #666; margin: 4px 0; padding-left: 12px; border-left: 3px solid #ddd;">${escapeHtml(item.note)}</p>`);
        htmlParts.push(`</div>`);
        break;
      case "textNote":
        htmlParts.push(`<div style="margin: 12px 0; padding: 12px; background: #f9f9f9; border-radius: 8px;">${escapeHtml(item.text)}</div>`);
        break;
      case "voiceNote":
        htmlParts.push(`<div style="margin: 12px 0;"><strong>Voice Note</strong> (${item.duration}s)`);
        htmlParts.push(`<p style="color: #999; font-size: 13px;">See attachment: voice-${escapeHtml(item.id)}.webm</p></div>`);
        break;
    }
  }

  htmlParts.push(`</div>`);

  // Collect attachments
  for (const [, file] of feedback.files) {
    attachments.push({
      filename: file.filename,
      content: file.blob,
      contentType: file.type,
    });
  }

  return {
    subject,
    html: htmlParts.join("\n"),
    text: textLines.join("\n"),
    attachments,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function priorityColor(priority: AnnotationPriority): string {
  switch (priority) {
    case "urgent": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#ca8a04";
    case "low": return "#65a30d";
    default: return "#666";
  }
}
