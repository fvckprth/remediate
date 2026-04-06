import { parseFeedback } from "remediate/server";
import { toEmail } from "remediate/email";

export async function POST(req: Request) {
  const parsed = await parseFeedback(req);
  const email = toEmail(parsed);

  const resendKey = process.env.RESEND_KEY!;
  const from = process.env.EMAIL_FROM || "feedback@yourapp.com";
  const to = process.env.EMAIL_TO || "team@yourapp.com";

  console.log(`\n[Feedback] ${parsed.submission.id} → sending email...`);

  // Convert attachments to base64 for Resend API
  const attachments = await Promise.all(
    email.attachments.map(async (a) => ({
      filename: a.filename,
      content: Buffer.from(await a.content.arrayBuffer()).toString("base64"),
      content_type: a.contentType,
    })),
  );

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments,
    }),
  });

  const data = await res.json();
  console.log(`[Email] Sent: ${res.ok} (${data.id || res.status})`);

  return Response.json({ ok: true, id: parsed.submission.id, emailId: data.id });
}
