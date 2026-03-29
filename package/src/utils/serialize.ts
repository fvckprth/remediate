import type { FeedbackSubmission, FeedbackItem } from "../types";

/**
 * Serialize a FeedbackSubmission into FormData for network transfer.
 *
 * Wire format:
 *   metadata        → JSON string (submission without blobs)
 *   screenshot-{id} → PNG Blob  (filename: screenshot-{id}.png)
 *   recording-{id}  → WebM Blob (filename: recording-{id}.webm)
 *   voice-{id}      → WebM Blob (filename: voice-{id}.webm)
 */
export function serializeToFormData(submission: FeedbackSubmission): FormData {
  const form = new FormData();

  // Strip blobs from items for the JSON metadata
  const itemsWithoutBlobs = submission.items.map((item) => {
    const { blob, ...rest } = item as FeedbackItem & { blob?: Blob };
    return rest;
  });

  const metadata = {
    ...submission,
    items: itemsWithoutBlobs,
  };
  form.append("metadata", JSON.stringify(metadata));

  // Append blobs as named files
  for (const item of submission.items) {
    if (!("blob" in item) || !(item as FeedbackItem & { blob?: Blob }).blob) continue;

    const blob = (item as FeedbackItem & { blob?: Blob }).blob!;

    switch (item.type) {
      case "photo":
        form.append(`screenshot-${item.id}`, blob, `screenshot-${item.id}.png`);
        break;
      case "video":
        form.append(`recording-${item.id}`, blob, `recording-${item.id}.webm`);
        break;
      case "voiceNote":
        form.append(`voice-${item.id}`, blob, `voice-${item.id}.webm`);
        break;
    }
  }

  return form;
}
