import type { ParsedFeedback } from "../server/parse";
import type { AnnotationPriority } from "../types";
import { deriveFeedbackTitle, renderEnvironmentText, priorityTag } from "./shared";

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

  const title = deriveFeedbackTitle(submission.items, 60);
  const subject = title === "User Feedback"
    ? `Feedback from ${new URL(submission.url).pathname}`
    : title;

  // --- Plain text ---
  const textLines: string[] = [];
  textLines.push(title);
  textLines.push("");
  textLines.push(`Page: ${submission.url}`);
  textLines.push("");

  for (const item of submission.items) {
    switch (item.type) {
      case "photo":
        textLines.push(`Screenshot${priorityTag(item.priority)}`);
        if (item.additionalText) textLines.push(`  ${item.additionalText}`);
        textLines.push(`  See attachment: screenshot-${item.id}.png`);
        break;
      case "video":
        textLines.push(`Screen Recording (${item.duration}s)${priorityTag(item.priority)}`);
        if (item.additionalText) textLines.push(`  ${item.additionalText}`);
        textLines.push(`  See attachment: recording-${item.id}.webm`);
        break;
      case "annotation":
        textLines.push(`Annotation: ${item.element.name}${priorityTag(item.priority)}`);
        if (item.note) textLines.push(`  ${item.note}`);
        break;
      case "textNote":
        textLines.push(`Note${priorityTag(item.priority)}`);
        textLines.push(`  ${item.text}`);
        break;
      case "voiceNote":
        textLines.push(`Voice Note (${item.duration}s)${priorityTag(item.priority)}`);
        if (item.additionalText) textLines.push(`  ${item.additionalText}`);
        textLines.push(`  See attachment: voice-${item.id}.webm`);
        break;
    }
    textLines.push("");
  }

  textLines.push("---");
  textLines.push(...renderEnvironmentText(env));

  // --- HTML ---
  const h: string[] = [];
  h.push(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">`);
  h.push(`<h2 style="margin: 0 0 4px;">${esc(title)}</h2>`);
  h.push(`<p style="color: #666; margin: 0 0 16px;"><a href="${esc(submission.url)}" style="color: #666;">${esc(submission.url)}</a></p>`);

  for (const item of submission.items) {
    switch (item.type) {
      case "photo":
        h.push(`<div style="margin: 12px 0;">`);
        h.push(`<strong>Screenshot</strong>${priorityHtml(item.priority)}`);
        if (item.additionalText) h.push(`<p style="color: #333; margin: 4px 0;">${esc(item.additionalText)}</p>`);
        h.push(`<p style="color: #999; font-size: 13px; margin: 4px 0;">See attachment: screenshot-${esc(item.id)}.png</p>`);
        h.push(`</div>`);
        break;
      case "video":
        h.push(`<div style="margin: 12px 0;">`);
        h.push(`<strong>Screen Recording</strong> (${item.duration}s)${priorityHtml(item.priority)}`);
        if (item.additionalText) h.push(`<p style="color: #333; margin: 4px 0;">${esc(item.additionalText)}</p>`);
        h.push(`<p style="color: #999; font-size: 13px; margin: 4px 0;">See attachment: recording-${esc(item.id)}.webm</p>`);
        h.push(`</div>`);
        break;
      case "annotation":
        h.push(`<div style="margin: 12px 0;">`);
        h.push(`<strong>Annotation:</strong> <code>${esc(item.element.name)}</code>${priorityHtml(item.priority)}`);
        if (item.note) h.push(`<p style="color: #333; margin: 4px 0; padding-left: 12px; border-left: 3px solid #ddd;">${esc(item.note)}</p>`);
        h.push(`</div>`);
        break;
      case "textNote":
        h.push(`<div style="margin: 12px 0; padding: 12px; background: #f9f9f9; border-radius: 8px;">`);
        h.push(`${esc(item.text)}`);
        h.push(`</div>`);
        break;
      case "voiceNote":
        h.push(`<div style="margin: 12px 0;">`);
        h.push(`<strong>Voice Note</strong> (${item.duration}s)${priorityHtml(item.priority)}`);
        if (item.additionalText) h.push(`<p style="color: #333; margin: 4px 0;">${esc(item.additionalText)}</p>`);
        h.push(`<p style="color: #999; font-size: 13px; margin: 4px 0;">See attachment: voice-${esc(item.id)}.webm</p>`);
        h.push(`</div>`);
        break;
    }
  }

  h.push(`<hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />`);
  h.push(`<p style="color: #999; font-size: 13px; margin: 0;">${esc(env.browser.name)} ${esc(env.browser.version)} · ${esc(env.os.name)} ${esc(env.os.version)} · ${env.viewport.width}×${env.viewport.height} · ${env.devicePixelRatio}x DPR · ${esc(env.language)} · ${esc(env.timezone)} · ${esc(env.colorScheme)}</p>`);
  h.push(`</div>`);

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
    html: h.join("\n"),
    text: textLines.join("\n"),
    attachments,
  };
}

function esc(str: string): string {
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

function priorityHtml(priority: AnnotationPriority): string {
  if (priority === "none") return "";
  return ` <span style="color: ${priorityColor(priority)}; font-weight: 600;">[${priority}]</span>`;
}
