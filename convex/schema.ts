import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
    videos: defineTable({
        userId: v.string(),
        youtubeUrl: v.string(),
        youtubeId: v.string(),
        title: v.optional(v.string()),
        thumbnailUrl: v.optional(v.string()),
        transcript: v.optional(v.string()),
        blogContent: v.optional(v.string()),
        userNotes: v.optional(v.string()),
        customPrompt: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    actionablePoints: defineTable({
        videoId: v.id("videos"),
        content: v.string(),
        category: v.optional(v.string()),
        timestamp: v.optional(v.number()),
        isCompleted: v.optional(v.boolean()),
        order: v.number(),
    }).index("by_video", ["videoId"]),
});
