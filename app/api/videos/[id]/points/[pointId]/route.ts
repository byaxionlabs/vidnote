import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { actionablePoints, videos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; pointId: string }> }
) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, pointId } = await params;
        const { isCompleted } = await request.json();

        // Verify the video belongs to the user
        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Update the point
        await db
            .update(actionablePoints)
            .set({ isCompleted })
            .where(
                and(
                    eq(actionablePoints.id, pointId),
                    eq(actionablePoints.videoId, id)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating point:", error);
        return NextResponse.json(
            { error: "Failed to update point" },
            { status: 500 }
        );
    }
}
