import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const insert = mutation({
  args: {
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
  },
  returns: v.id("feedback"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("feedback", args);
  },
});
