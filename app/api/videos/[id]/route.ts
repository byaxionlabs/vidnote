import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos, actionablePoints } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const points = await db
            .select()
            .from(actionablePoints)
            .where(eq(actionablePoints.videoId, id))
            .orderBy(actionablePoints.order);

        return NextResponse.json({ video, points });
    } catch (error) {
        console.error("Error fetching video:", error);
        return NextResponse.json(
            { error: "Failed to fetch video" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        // Verify the video belongs to the user
        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Delete actionable points first (foreign key constraint)
        await db.delete(actionablePoints).where(eq(actionablePoints.videoId, id));

        // Delete the video
        await db.delete(videos).where(eq(videos.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting video:", error);
        return NextResponse.json(
            { error: "Failed to delete video" },
            { status: 500 }
        );
    }
}
