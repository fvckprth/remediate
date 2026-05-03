import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  feedback: defineTable({
    submissionId: v.string(),
    url: v.string(),
    timestamp: v.string(),
    itemCount: v.number(),
    metadata: v.any(),
    payload: v.any(),
    files: v.array(
      v.object({
        filename: v.string(),
        storageId: v.id("_storage"),
        contentType: v.string(),
        size: v.number(),
      })
    ),
  })
    .index("by_submissionId", ["submissionId"])
    .index("by_url", ["url"]),
});
