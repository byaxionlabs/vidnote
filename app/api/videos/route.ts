import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos, actionablePoints } from "@/lib/db/schema";
import { extractVideoId, getYouTubeThumbnail, getVideoMetadata, isTheoChannel } from "@/lib/youtube";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { actionablePointsSchema } from "@/lib/schemas";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
        }

        // Get video metadata
        const metadata = await getVideoMetadata(videoId);
        const thumbnailUrl = getYouTubeThumbnail(videoId);

        // Validate that the video is from Theo's channel
        if (!isTheoChannel(metadata.authorUrl)) {
            const funnyMessages = [
                "🚫 Hold up! This app is EXCLUSIVELY for Theo's videos. We're loyal fans here! Go find a video from @t3dotgg and try again.",
                "😤 Excuse me? That's not a Theo video! This app only speaks fluent @t3dotgg. Please try again with authentic Theo content!",
                "🙅 Nice try, but this isn't a Theo video! We're ride-or-die for @t3dotgg here. Bring us the real deal!",
                "⚠️ WARNING: Non-Theo video detected! This app runs on pure @t3dotgg energy. Find a video from Theo and come back!",
                "🤨 That video isn't from Theo's channel... Are you trying to cheat on @t3dotgg? We don't do that here!",
            ];
            const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

            return NextResponse.json(
                { error: randomMessage },
                { status: 400 }
            );
        }

        // Normalize YouTube URL for AI
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        const prompt = `You are an expert at extracting actionable insights from educational content. 

Given the YouTube video titled "${metadata.title}", extract:
1. **Action Items**: Specific things the viewer should DO after watching
2. **Key Takeaways**: Important facts or concepts to REMEMBER
3. **Insights**: Deeper understanding or "aha moments" from the content

IMPORTANT: For each point, also provide the timestamp (in seconds from the start of the video) where this point is discussed.

Rules:
- Be specific and concise (max 1-2 sentences per point)
- Focus on practical, implementable advice
- Skip filler content, intros, outros, sponsor segments
- Each point should be self-contained and understandable without context
- Aim for 5-15 total points depending on content length
- Timestamps should be ACCURATE to where the point is actually discussed in the video

Analyze this video: ${youtubeUrl}`;

        // Use generateText with Output.object() (replaces deprecated generateObject and direct @google/genai)
        const { output } = await generateText({
            model: google("gemini-3-flash-preview"),
            output: Output.object({
                schema: actionablePointsSchema,
            }),
            prompt,
            maxRetries: 0,
        });

        const points = output?.points ?? [];

        // Save video to database
        const videoRecord = {
            id: nanoid(),
            userId: session.user.id,
            youtubeUrl: url,
            youtubeId: videoId,
            title: metadata.title,
            thumbnailUrl,
            transcript: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.insert(videos).values(videoRecord);

        // Save actionable points
        const pointRecords = points.map((point, index) => ({
            id: nanoid(),
            videoId: videoRecord.id,
            content: point.content,
            category: point.category,
            timestamp: point.timestamp || null,
            isCompleted: false,
            order: index,
            createdAt: new Date(),
        }));

        if (pointRecords.length > 0) {
            await db.insert(actionablePoints).values(pointRecords);
        }

        return NextResponse.json({
            video: {
                id: videoRecord.id,
                title: metadata.title,
                thumbnailUrl,
                youtubeId: videoId,
            },
            points: pointRecords,
        });
    } catch (error) {
        console.error("Error processing video:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to process video" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userVideos = await db
            .select()
            .from(videos)
            .where(eq(videos.userId, session.user.id))
            .orderBy(videos.createdAt);

        return NextResponse.json({ videos: userVideos.reverse() });
    } catch (error) {
        console.error("Error fetching videos:", error);
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}
