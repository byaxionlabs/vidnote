import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos, actionablePoints } from "@/lib/db/schema";
import { nanoid } from "nanoid";

export interface SaveVideoRequest {
    url: string;
    videoId: string;
    title: string;
    thumbnailUrl: string;
    points: Array<{
        content: string;
        category: string;
        timestamp?: number;
    }>;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: SaveVideoRequest = await request.json();
        const { url, videoId, title, thumbnailUrl, points } = body;

        if (!url || !videoId || !title) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Create video record
        const videoRecord = {
            id: nanoid(),
            userId: session.user.id,
            youtubeUrl: url,
            youtubeId: videoId,
            title,
            thumbnailUrl,
            transcript: "",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.insert(videos).values(videoRecord);

        // Save actionable points
        if (points && points.length > 0) {
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

            await db.insert(actionablePoints).values(pointRecords);
        }

        return NextResponse.json({
            success: true,
            video: {
                id: videoRecord.id,
                title: videoRecord.title,
                thumbnailUrl: videoRecord.thumbnailUrl,
                youtubeId: videoRecord.youtubeId,
            },
        });
    } catch (error) {
        console.error("Error saving video:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save video" },
            { status: 500 }
        );
    }
}
