import { parseFeedback } from "remediate/server";
import { toGithubIssue } from "remediate/github";

export async function POST(req: Request) {
  const parsed = await parseFeedback(req);
  const issue = toGithubIssue(parsed);

  const token = process.env.GITHUB_TOKEN!;
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;

  console.log(`\n[Feedback] ${parsed.submission.id} → creating GitHub issue...`);

  // Upload files and replace placeholders in the body
  let body = issue.body;

  for (const file of issue.files) {
    const buffer = Buffer.from(await file.content.arrayBuffer());
    const base64 = buffer.toString("base64");

    // Upload to repo (creates a file in a feedback-assets branch)
    const path = `feedback-assets/${parsed.submission.id}/${file.filename}`;
    const uploadRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `feedback: upload ${file.filename}`,
          content: base64,
          branch: "feedback-assets",
        }),
      },
    );

    if (uploadRes.ok) {
      const data = await uploadRes.json();
      const downloadUrl = data.content.download_url;
      body = body.replace(file.placeholder, downloadUrl);
      console.log(`[GitHub] Uploaded ${file.filename}`);
    } else {
      console.log(`[GitHub] Upload failed for ${file.filename}: ${uploadRes.status}`);
      body = body.replace(file.placeholder, "(upload failed)");
    }
  }

  // Create the issue
  const createRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: issue.title,
        body,
        labels: issue.labels,
      }),
    },
  );

  const created = await createRes.json();
  console.log(`[GitHub] Issue created: #${created.number} — ${created.title}`);

  return Response.json({ ok: true, id: parsed.submission.id, githubIssue: created.number });
}
