import { db } from "@/db";
import { feedback, feedbackItems, apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createHash } from "crypto";
import { getSignedUrl } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate project key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing project key" }, { status: 401 });
  }
  const key = authHeader.slice(7);
  const keyHash = createHash("sha256").update(key).digest("hex");

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!apiKey) {
    return Response.json({ error: "Invalid project key" }, { status: 401 });
  }

  // Fetch feedback
  const [entry] = await db
    .select()
    .from(feedback)
    .where(eq(feedback.id, id))
    .limit(1);

  if (!entry) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Ensure the feedback belongs to the authenticated project
  if (entry.projectId !== apiKey.projectId) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch items and generate signed URLs for files
  const items = await db
    .select()
    .from(feedbackItems)
    .where(eq(feedbackItems.feedbackId, id));

  const itemsWithUrls = await Promise.all(
    items.map(async (item) => ({
      ...item,
      fileUrl: item.fileUrl ? await getSignedUrl(item.fileUrl) : null,
    }))
  );

  return Response.json({
    ...entry,
    items: itemsWithUrls,
  });
}
