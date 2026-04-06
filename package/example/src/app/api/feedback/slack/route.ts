import { parseFeedback } from "remediate/server";
import { toSlackMessage } from "remediate/slack";

export async function POST(req: Request) {
  const parsed = await parseFeedback(req);
  const msg = toSlackMessage(parsed);

  const token = process.env.SLACK_TOKEN!;
  const channel = process.env.SLACK_CHANNEL_ID!;

  console.log(`\n[Feedback] ${parsed.submission.id} → posting to Slack...`);

  // Post the message
  const postRes = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      blocks: msg.blocks,
      text: msg.text,
    }),
  });

  const postData = await postRes.json();
  console.log(`[Slack] Message posted: ${postData.ok}`);

  // Upload files
  for (const file of msg.files) {
    const form = new FormData();
    form.append("file", file.content, file.filename);
    form.append("channels", channel);
    form.append("title", file.title);
    form.append("filename", file.filename);

    const uploadRes = await fetch("https://slack.com/api/files.uploadV2", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const uploadData = await uploadRes.json();
    console.log(`[Slack] Upload ${file.filename}: ${uploadData.ok}`);
  }

  return Response.json({ ok: true, id: parsed.submission.id });
}
