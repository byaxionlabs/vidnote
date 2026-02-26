import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/videos/[id]/notes — fetch user notes
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
            .select({ userNotes: videos.userNotes })
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        return NextResponse.json({ userNotes: video.userNotes || null });
    } catch (error) {
        console.error("Error fetching user notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch notes" },
            { status: 500 }
        );
    }
}

// PUT /api/videos/[id]/notes — save user notes
export async function PUT(
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
        const body = await request.json();
        const { userNotes } = body;

        // Verify the video belongs to the user
        const [video] = await db
            .select({ id: videos.id })
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        await db
            .update(videos)
            .set({ userNotes, updatedAt: new Date() })
            .where(eq(videos.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving user notes:", error);
        return NextResponse.json(
            { error: "Failed to save notes" },
            { status: 500 }
        );
    }
}
