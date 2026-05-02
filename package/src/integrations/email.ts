import type { ParsedFeedback } from "../server/parse";
import type { AnnotationPriority } from "../types";
import { deriveFeedbackTitle, renderEnvironmentText, priorityTag, summarizeItem, type FeedbackFile } from "./shared";

/** @deprecated Use FeedbackFile from remediate/integrations/shared instead. */
export type EmailAttachment = FeedbackFile;

export interface EmailPayload {
  /** Email subject line. */
  subject: string;
  /** HTML email body. */
  html: string;
  /** Plain text email body. */
  text: string;
  /** File attachments (screenshots, videos, voice notes). */
  attachments: FeedbackFile[];
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
  const attachments: FeedbackFile[] = [];

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
    const s = summarizeItem(item);
    const heading = s.elementName ? `${s.label}: ${s.elementName}` : s.label;
    textLines.push(`${heading}${priorityTag(s.priority)}`);
    if (s.text) textLines.push(`  ${s.text}`);
    if (s.filePrefix) textLines.push(`  See attachment: ${s.filePrefix}-${s.itemId}.${s.filePrefix === "screenshot" ? "png" : "webm"}`);
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
    const s = summarizeItem(item);
    const heading = s.elementName
      ? `<strong>${s.label}:</strong> <code>${esc(s.elementName)}</code>`
      : `<strong>${esc(s.label)}</strong>`;

    h.push(`<div style="margin: 12px 0;">`);

    if (s.label === "Note" && !s.filePrefix) {
      h.push(`<div style="padding: 12px; background: #f9f9f9; border-radius: 8px;">${esc(s.text ?? "")}</div>`);
    } else {
      h.push(`${heading}${priorityHtml(s.priority)}`);
      if (s.text) {
        const style = s.elementName
          ? `style="color: #333; margin: 4px 0; padding-left: 12px; border-left: 3px solid #ddd;"`
          : `style="color: #333; margin: 4px 0;"`;
        h.push(`<p ${style}>${esc(s.text)}</p>`);
      }
      if (s.filePrefix) {
        const ext = s.filePrefix === "screenshot" ? "png" : "webm";
        h.push(`<p style="color: #999; font-size: 13px; margin: 4px 0;">See attachment: ${s.filePrefix}-${esc(s.itemId)}.${ext}</p>`);
      }
    }

    h.push(`</div>`);
  }

  h.push(`<hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />`);
  h.push(`<p style="color: #999; font-size: 13px; margin: 0;">${esc(env.browser.name)} ${esc(env.browser.version)} · ${esc(env.os.name)} ${esc(env.os.version)} · ${env.viewport.width}×${env.viewport.height} · ${env.devicePixelRatio}x DPR · ${esc(env.language)} · ${esc(env.timezone)} · ${esc(env.colorScheme)}</p>`);
  h.push(`</div>`);

  for (const [, file] of feedback.files) {
    attachments.push({
      filename: file.filename,
      content: file.blob,
      contentType: file.type,
      placeholder: null,
      title: file.filename,
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
