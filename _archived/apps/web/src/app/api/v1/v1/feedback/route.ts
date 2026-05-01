import { parseFeedback } from "remediate/server";
import { db } from "@/db";
import { feedback, feedbackItems, apiKeys, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { uploadBlob, getSignedUrl } from "@/lib/storage";
import { createHash } from "crypto";

// CORS is intentionally open — the widget runs on customer domains.
// The API key (Bearer token) is the security boundary, not origin.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

// --- Rate limiting (in-memory, per API key) ---
const MAX_REQUESTS = 60;
const WINDOW_MS = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyHash: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(keyHash);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(keyHash, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}

// --- Validation limits ---
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MAX_ITEMS = 20;
const VALID_ITEM_TYPES = new Set(["photo", "video", "voiceNote", "annotation", "textNote"]);

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  // 1. Validate project key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing project key" }, { status: 401, headers: corsHeaders });
  }
  const key = authHeader.slice(7);
  const keyHash = createHash("sha256").update(key).digest("hex");

  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, keyHash))
    .limit(1);

  if (!apiKey) {
    return Response.json({ error: "Invalid project key" }, { status: 401, headers: corsHeaders });
  }

  // 2. Rate limit
  const { allowed, remaining } = checkRateLimit(keyHash);
  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429, headers: { ...corsHeaders, "Retry-After": "60" } }
    );
  }

  // 3. Parse FormData
  let submission;
  let files;
  try {
    ({ submission, files } = await parseFeedback(req));
  } catch {
    return Response.json(
      { error: "Invalid feedback payload" },
      { status: 400, headers: corsHeaders }
    );
  }

  // 4. Validate payload
  if (submission.items.length > MAX_ITEMS) {
    return Response.json(
      { error: `Too many items (max ${MAX_ITEMS})` },
      { status: 400, headers: corsHeaders }
    );
  }

  for (const item of submission.items) {
    if (!VALID_ITEM_TYPES.has(item.type)) {
      return Response.json(
        { error: `Invalid item type: ${item.type}` },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  for (const [, file] of files) {
    if (file.blob.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  try {
    // 5. Upload blobs to R2
    const fileKeys = new Map<string, { key: string; size: number }>();
    for (const [fieldName, file] of files) {
      const storageKey = `${apiKey.projectId}/${submission.id}/${file.filename}`;
      const uploadedKey = await uploadBlob(storageKey, file.blob, file.type);
      fileKeys.set(fieldName, { key: uploadedKey, size: file.blob.size });
    }

    // 6. Insert feedback + items in batch
    await db.insert(feedback).values({
      id: submission.id,
      projectId: apiKey.projectId,
      url: submission.url,
      timestamp: new Date(submission.timestamp),
      environment: submission.environment,
      metadata: submission.metadata,
    });

    const itemRows = submission.items.map((item) => {
      const { blob, ...itemData } = item as typeof item & { blob?: unknown };
      const fileKey =
        item.type === "photo"
          ? `screenshot-${item.id}`
          : item.type === "video"
            ? `recording-${item.id}`
            : item.type === "voiceNote"
              ? `voice-${item.id}`
              : null;
      const fileInfo = fileKey ? fileKeys.get(fileKey) : null;

      return {
        id: item.id,
        feedbackId: submission.id,
        type: item.type,
        index: item.index,
        data: itemData,
        fileUrl: fileInfo?.key ?? null,
        fileSize: fileInfo?.size ?? null,
      };
    });

    if (itemRows.length > 0) {
      await db.insert(feedbackItems).values(itemRows);
    }

    // 7. Forward to webhook (fire-and-forget, with logging)
    const [project] = await db
      .select({ webhookUrl: projects.webhookUrl })
      .from(projects)
      .where(eq(projects.id, apiKey.projectId))
      .limit(1);

    if (project?.webhookUrl) {
      const itemsWithUrls = await Promise.all(
        submission.items.map(async (item) => {
          const { blob, ...rest } = item as typeof item & { blob?: unknown };
          const fileKey =
            item.type === "photo"
              ? `screenshot-${item.id}`
              : item.type === "video"
                ? `recording-${item.id}`
                : item.type === "voiceNote"
                  ? `voice-${item.id}`
                  : null;
          const fileInfo = fileKey ? fileKeys.get(fileKey) : null;
          return {
            ...rest,
            fileUrl: fileInfo ? await getSignedUrl(fileInfo.key) : null,
          };
        })
      );

      fetch(project.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: submission.id,
          projectId: apiKey.projectId,
          url: submission.url,
          timestamp: submission.timestamp,
          environment: submission.environment,
          metadata: submission.metadata,
          items: itemsWithUrls,
        }),
      }).catch((err) => {
        console.error(`[webhook] Failed to deliver to ${project.webhookUrl}:`, err.message);
      });
    }

    return Response.json(
      { ok: true, id: submission.id },
      { headers: { ...corsHeaders, "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (err) {
    console.error("[feedback] Ingestion failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
