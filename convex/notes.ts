import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./auth";

export const updateNotes = mutation({
    args: { videoId: v.id("videos"), userNotes: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        await ctx.db.patch(args.videoId, { userNotes: args.userNotes });
    }
});

export const updateBlogContent = mutation({
    args: { videoId: v.id("videos"), blogContent: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        await ctx.db.patch(args.videoId, { blogContent: args.blogContent });
    }
});

export const deleteBlogContent = mutation({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        await ctx.db.patch(args.videoId, { blogContent: undefined });
    }
});
