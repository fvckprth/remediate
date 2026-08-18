import type { FeedbackItem } from "../types";

/**
 * Single source of truth for the file key naming convention.
 *
 * Wire format:  `{prefix}-{itemId}`  (e.g. `screenshot-cap_abc123`)
 * Filename:     `{prefix}-{itemId}.{ext}`
 */

export type FileCategory = "screenshot" | "recording" | "voice";

const ITEM_TYPE_TO_FILE: Record<string, { prefix: FileCategory; ext: string }> = {
  photo:     { prefix: "screenshot", ext: "png" },
  video:     { prefix: "recording",  ext: "webm" },
  voiceNote: { prefix: "voice",      ext: "webm" },
};

const PREFIX_TO_ITEM_TYPE: Record<FileCategory, string> = {
  screenshot: "photo",
  recording:  "video",
  voice:      "voiceNote",
};

/** All recognized file prefixes, in the order they appear in FormData. */
export const FILE_PREFIXES: readonly FileCategory[] = ["screenshot", "recording", "voice"] as const;

/** Build the FormData field key for an item. Returns null for item types without files. */
export function fileKey(item: Pick<FeedbackItem, "type" | "id">): string | null {
  const entry = ITEM_TYPE_TO_FILE[item.type];
  return entry ? `${entry.prefix}-${item.id}` : null;
}

/** Build the filename for an item. Returns null for item types without files. */
export function fileName(item: Pick<FeedbackItem, "type" | "id">): string | null {
  const entry = ITEM_TYPE_TO_FILE[item.type];
  return entry ? `${entry.prefix}-${item.id}.${entry.ext}` : null;
}

/** Parse a FormData field key into category + itemId. Returns null if unrecognized. */
export function parseFileKey(key: string): { category: FileCategory; itemId: string } | null {
  for (const prefix of FILE_PREFIXES) {
    if (key.startsWith(`${prefix}-`)) {
      return { category: prefix, itemId: key.slice(prefix.length + 1) };
    }
  }
  return null;
}

/** Get the file prefix for an item type. Returns null for types without files. */
export function filePrefixForType(itemType: string): FileCategory | null {
  return ITEM_TYPE_TO_FILE[itemType]?.prefix ?? null;
}

/** Get the item type for a file prefix. */
export function itemTypeForPrefix(prefix: FileCategory): string {
  return PREFIX_TO_ITEM_TYPE[prefix];
}
