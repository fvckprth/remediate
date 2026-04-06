import { parseFeedback } from "remediate/server";
import { toWebhookPayload } from "remediate/webhook";

export async function POST(req: Request) {
  const parsed = await parseFeedback(req);
  const payload = await toWebhookPayload(parsed);

  const webhookUrl = process.env.WEBHOOK_URL!;

  console.log(`\n[Feedback] ${parsed.submission.id} → sending webhook...`);

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log(`[Webhook] Response: ${res.status}`);

  return Response.json({ ok: true, id: parsed.submission.id, status: res.status });
}
