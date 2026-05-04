import { nanoid } from "./nanoid";
import type { FeedbackItem } from "../types";

const PREFIXES: Record<FeedbackItem["type"], string> = {
  photo: "cap",
  video: "cap",
  annotation: "ann",
  textNote: "txt",
  voiceNote: "voc",
};

type ItemFields<T extends FeedbackItem["type"]> = Omit<
  Extract<FeedbackItem, { type: T }>,
  "id" | "index" | "timestamp" | "type"
>;

export function createItem<T extends FeedbackItem["type"]>(
  type: T,
  fields: ItemFields<T>,
): Extract<FeedbackItem, { type: T }> {
  return {
    id: `${PREFIXES[type]}_${nanoid(8)}`,
    index: 0,
    timestamp: Date.now(),
    type,
    ...fields,
  } as Extract<FeedbackItem, { type: T }>;
}
