import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos, actionablePoints } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify the video belongs to this user
        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const { points } = await request.json();

        if (!points || !Array.isArray(points) || points.length === 0) {
            return NextResponse.json({ error: "Points are required" }, { status: 400 });
        }

        // Insert points
        const pointRecords = points.map(
            (point: { content: string; category: string; timestamp?: number }, index: number) => ({
                id: nanoid(),
                videoId: id,
                content: point.content,
                category: point.category,
                timestamp: point.timestamp || null,
                isCompleted: false,
                order: index,
                createdAt: new Date(),
            }),
        );

        await db.insert(actionablePoints).values(pointRecords);

        return NextResponse.json({
            success: true,
            points: pointRecords.map((p) => ({
                id: p.id,
                content: p.content,
                category: p.category,
                timestamp: p.timestamp,
                isCompleted: p.isCompleted,
                order: p.order,
            })),
        });
    } catch (error) {
        console.error("Error saving points:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save points" },
            { status: 500 },
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify the video belongs to this user
        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Delete all points for this video
        await db.delete(actionablePoints).where(eq(actionablePoints.videoId, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting points:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete points" },
            { status: 500 },
        );
    }
}
