import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

        // Verify the video belongs to the user
        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        const { blogContent } = await request.json();

        if (!blogContent || typeof blogContent !== "string") {
            return NextResponse.json({ error: "Blog content is required" }, { status: 400 });
        }

        // Save blog content to the video
        await db
            .update(videos)
            .set({ blogContent, updatedAt: new Date() })
            .where(eq(videos.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving blog:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to save blog" },
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

        // Verify the video belongs to the user
        const [video] = await db
            .select()
            .from(videos)
            .where(and(eq(videos.id, id), eq(videos.userId, session.user.id)));

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Clear blog content
        await db
            .update(videos)
            .set({ blogContent: null, updatedAt: new Date() })
            .where(eq(videos.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting blog:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to delete blog" },
            { status: 500 },
        );
    }
}
