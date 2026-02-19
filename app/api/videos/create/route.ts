import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import {
    extractVideoId,
    getVideoMetadata,
    getYouTubeThumbnail,
    isTheoChannel,
} from "@/lib/youtube";

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
        let metadata;
        try {
            metadata = await getVideoMetadata(videoId);
        } catch (err) {
            return NextResponse.json(
                { error: err instanceof Error ? err.message : "Failed to fetch video metadata" },
                { status: 500 },
            );
        }

        // Check if it's a Theo video
        if (!isTheoChannel(metadata.authorUrl)) {
            return NextResponse.json(
                { error: "Only videos from Theo's channel (@t3dotgg) are supported" },
                { status: 400 },
            );
        }

        const thumbnailUrl = getYouTubeThumbnail(videoId);

        // Create video record (no points yet — streaming will add them)
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

        return NextResponse.json({
            video: {
                id: videoRecord.id,
                youtubeUrl: videoRecord.youtubeUrl,
                youtubeId: videoRecord.youtubeId,
                title: videoRecord.title,
                thumbnailUrl: videoRecord.thumbnailUrl,
                createdAt: videoRecord.createdAt.toISOString(),
            },
        });
    } catch (error) {
        console.error("Error creating video:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to create video" },
            { status: 500 },
        );
    }
}
