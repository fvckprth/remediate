import type { FeedbackSubmission } from "../types";

export interface ParsedFile {
  blob: Blob;
  filename: string;
  type: string;
  /** The feedback item ID this file belongs to */
  itemId: string;
  /** "screenshot" | "recording" | "voice" */
  category: "screenshot" | "recording" | "voice";
}

export interface ParsedFeedback {
  /** The structured feedback submission (no blobs). */
  submission: FeedbackSubmission;
  /** Map of field name → parsed file info. */
  files: Map<string, ParsedFile>;
}

/**
 * Parse a Remediate FormData submission from an incoming Request.
 *
 * Works with any Web-standard Request (Next.js App Router, Hono, Bun, Deno, etc.).
 *
 * @example
 * ```ts
 * import { parseFeedback } from "remediate/server";
 *
 * export async function POST(req: Request) {
 *   const { submission, files } = await parseFeedback(req);
 *   // submission.items, submission.environment, etc.
 *   // files.get("screenshot-cap_abc123") → { blob, filename, type, itemId, category }
 * }
 * ```
 */
export async function parseFeedback(req: Request): Promise<ParsedFeedback> {
  const formData = await req.formData();

  const metadataField = formData.get("metadata");
  if (!metadataField || typeof metadataField !== "string") {
    throw new Error("Missing or invalid 'metadata' field in FormData");
  }

  const submission: FeedbackSubmission = JSON.parse(metadataField);
  const files = new Map<string, ParsedFile>();

  for (const [key, value] of formData.entries()) {
    if (key === "metadata") continue;
    if (!(value instanceof Blob)) continue;

    let category: ParsedFile["category"];
    let itemId: string;

    if (key.startsWith("screenshot-")) {
      category = "screenshot";
      itemId = key.slice("screenshot-".length);
    } else if (key.startsWith("recording-")) {
      category = "recording";
      itemId = key.slice("recording-".length);
    } else if (key.startsWith("voice-")) {
      category = "voice";
      itemId = key.slice("voice-".length);
    } else {
      continue;
    }

    const file = value as File;
    files.set(key, {
      blob: value,
      filename: file.name || `${key}`,
      type: file.type || "application/octet-stream",
      itemId,
      category,
    });
  }

  return { submission, files };
}
