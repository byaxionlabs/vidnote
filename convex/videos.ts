import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./auth";

export const getDashboardVideos = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return []; // Return empty array or throw error for unauthenticated users

        const videos = await ctx.db
            .query("videos")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc") // descending order by creationTime
            .collect();

        return videos;
    },
});

export const getVideoById = query({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            return null;
        }

        const points = await ctx.db
            .query("actionablePoints")
            .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
            .collect();

        // Order by order
        points.sort((a, b) => a.order - b.order);

        return {
            video,
            points,
            blogContent: video.blogContent || null,
            userNotes: video.userNotes || null,
            customPrompt: video.customPrompt || null
        };
    }
});

export const deleteVideo = mutation({
    args: { videoId: v.id("videos") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        const points = await ctx.db
            .query("actionablePoints")
            .withIndex("by_video", (q) => q.eq("videoId", args.videoId))
            .collect();

        for (const point of points) {
            await ctx.db.delete(point._id);
        }

        await ctx.db.delete(args.videoId);
    }
});


export const createFastVideo = mutation({
    args: {
        url: v.string(),
        youtubeId: v.string(),
        thumbnailUrl: v.string(),
        customPrompt: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const videoId = await ctx.db.insert("videos", {
            userId,
            youtubeUrl: args.url,
            youtubeId: args.youtubeId,
            title: "Loading video info...",
            thumbnailUrl: args.thumbnailUrl,
            customPrompt: args.customPrompt,
            transcript: "",
        });

        return videoId;
    }
});

export const updateVideoTitle = mutation({
    args: {
        videoId: v.id("videos"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        await ctx.db.patch(args.videoId, { title: args.title });
    }
});
