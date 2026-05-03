import { parseFeedback } from "remediate/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { submission, files } = await parseFeedback(req);

    const uploaded: Array<{
      filename: string;
      storageId: Id<"_storage">;
      contentType: string;
      size: number;
    }> = [];

    for (const [filename, parsed] of files) {
      const file = parsed as unknown as {
        blob: Blob;
        filename: string;
        type: string;
        itemId: string;
        category: string;
      };

      const uploadUrl = await convex.mutation(api.feedback.generateUploadUrl, {});

      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file.blob,
      });

      if (!res.ok) {
        throw new Error(
          `convex storage upload failed for ${filename}: ${res.status} ${await res.text()}`
        );
      }

      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

      uploaded.push({
        filename,
        storageId,
        contentType: file.type || "application/octet-stream",
        size: file.blob.size,
      });
    }

    const id = await convex.mutation(api.feedback.insert, {
      submissionId: submission.id,
      url: submission.url,
      timestamp: submission.timestamp,
      itemCount: submission.items.length,
      metadata: submission.metadata,
      payload: submission,
      files: uploaded,
    });

    return Response.json({ ok: true, id: submission.id, convexId: id });
  } catch (err) {
    console.error("[api/feedback] failed", err);
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
