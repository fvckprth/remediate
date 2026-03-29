import type { ParsedFeedback } from "../server/parse";
import type { FeedbackSubmission } from "../types";

export interface WebhookPayload {
  /** Feedback submission with blobs as base64 data URIs. */
  submission: FeedbackSubmission & {
    items: Array<FeedbackSubmission["items"][number] & {
      /** Base64 data URI of the file, if present. */
      fileDataUri?: string;
    }>;
  };
}

/**
 * Format feedback as a JSON webhook payload with base64-encoded files.
 *
 * Compatible with Zapier, Make, n8n, and any webhook consumer.
 * Files are encoded as data URIs inline with their items.
 *
 * @example
 * ```ts
 * import { toWebhookPayload } from "remediate/webhook";
 *
 * const payload = await toWebhookPayload(feedback);
 * await fetch("https://hooks.zapier.com/...", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify(payload),
 * });
 * ```
 */
export async function toWebhookPayload(feedback: ParsedFeedback): Promise<WebhookPayload> {
  const { submission } = feedback;

  const items = await Promise.all(
    submission.items.map(async (item) => {
      const { blob, ...rest } = item as typeof item & { blob?: Blob };
      let fileDataUri: string | undefined;

      // Check if we have a file for this item
      const fileKeys = [`screenshot-${item.id}`, `recording-${item.id}`, `voice-${item.id}`];
      for (const key of fileKeys) {
        const file = feedback.files.get(key);
        if (file) {
          const arrayBuffer = await file.blob.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          const chunks: string[] = [];
          for (let i = 0; i < bytes.length; i += 8192) {
            chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
          }
          const base64 = btoa(chunks.join(""));
          fileDataUri = `data:${file.type};base64,${base64}`;
          break;
        }
      }

      return { ...rest, fileDataUri };
    })
  );

  return {
    submission: { ...submission, items },
  };
}
