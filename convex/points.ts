import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "./auth";

export const updatePoint = mutation({
    args: {
        videoId: v.id("videos"),
        pointId: v.id("actionablePoints"),
        isCompleted: v.boolean()
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        const point = await ctx.db.get(args.pointId);
        if (!point || point.videoId !== args.videoId) {
            throw new Error("Point not found");
        }

        await ctx.db.patch(args.pointId, { isCompleted: args.isCompleted });
    }
});

export const createPoints = mutation({
    args: {
        videoId: v.id("videos"),
        points: v.array(v.object({
            content: v.string(),
            category: v.optional(v.string()),
            timestamp: v.optional(v.number()),
            order: v.number()
        }))
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const video = await ctx.db.get(args.videoId);
        if (!video || video.userId !== userId) {
            throw new Error("Video not found");
        }

        const newPointIds = [];
        for (const point of args.points) {
            const id = await ctx.db.insert("actionablePoints", {
                videoId: args.videoId,
                content: point.content,
                category: point.category,
                timestamp: point.timestamp,
                isCompleted: false,
                order: point.order
            });
            newPointIds.push(id);
        }

        return newPointIds;
    }
});

export const deletePoints = mutation({
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
    }
});
