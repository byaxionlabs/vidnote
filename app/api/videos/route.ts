import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos, actionablePoints } from "@/lib/db/schema";
import { extractVideoId, getYouTubeThumbnail, getVideoMetadata } from "@/lib/youtube";
import { extractActionablePoints } from "@/lib/ai";
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

        // Normalize YouTube URL for Gemini
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Extract actionable points using AI (Gemini processes video directly)
        const points = await extractActionablePoints(youtubeUrl, metadata.title);

        // Save video to database
        const videoRecord = {
            id: nanoid(),
            userId: session.user.id,
            youtubeUrl: url,
            youtubeId: videoId,
            title: metadata.title,
            thumbnailUrl,
            transcript: "", // No longer fetching transcript separately
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
