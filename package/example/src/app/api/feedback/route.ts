import { parseFeedback } from "remediate/server";
import { toLinearIssue } from "remediate/linear";
import { LinearClient } from "@linear/sdk";

const linear = new LinearClient({
  apiKey: process.env.LINEAR_API_KEY!,
});

const TEAM_ID = "d02d2f6a-48ef-4a1d-a37b-4d106021003a";

export async function POST(req: Request) {
  const parsed = await parseFeedback(req);
  const issue = toLinearIssue(parsed);

  console.log(`\n[Feedback] ${parsed.submission.id} → creating Linear issue...`);

  // Upload files to Linear and replace placeholders in description
  let description = issue.description;

  for (const file of issue.files) {
    const uploadPayload = await linear.fileUpload(
      file.content.type,
      file.filename,
      file.content.size,
    );

    if (uploadPayload.success && uploadPayload.uploadFile) {
      const { uploadUrl, assetUrl, headers: uploadHeaders } = uploadPayload.uploadFile;

      // Upload the file to Linear's storage
      const contentType = file.content.type ||
        (file.filename.endsWith(".png") ? "image/png" :
         file.filename.endsWith(".webm") ? "video/webm" :
         "application/octet-stream");

      const buffer = Buffer.from(await file.content.arrayBuffer());
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          ...uploadHeaders.reduce(
            (acc, { key, value }) => ({ ...acc, [key]: value }),
            {} as Record<string, string>,
          ),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
        },
        body: buffer,
      });

      console.log(`[Linear] Upload ${file.filename}: ${uploadRes.status}`);

      // Replace placeholder with markdown image/link
      const isImage = file.filename.endsWith(".png") || file.filename.endsWith(".jpg");
      const markdown = isImage
        ? `![${file.filename}](${assetUrl})`
        : `[${file.filename}](${assetUrl})`;
      description = description.replace(file.placeholder, markdown);
    }
  }

  // Create the issue
  const created = await linear.createIssue({
    teamId: TEAM_ID,
    title: issue.title,
    description,
  });

  const createdIssue = await created.issue;
  console.log(`[Linear] Issue created: ${createdIssue?.identifier} — ${createdIssue?.title}`);

  return Response.json({ ok: true, id: parsed.submission.id, linearIssue: createdIssue?.identifier });
}
