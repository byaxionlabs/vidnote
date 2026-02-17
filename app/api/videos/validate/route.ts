import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    extractVideoId,
    getYouTubeThumbnail,
    getVideoMetadata,
    isTheoChannel,
} from "@/lib/youtube";

// Validate a video URL and return metadata before starting the stream
export async function POST(request: NextRequest) {
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
        return NextResponse.json(
            { error: "Invalid YouTube URL" },
            { status: 400 },
        );
    }

    // Get video metadata
    let metadata;
    try {
        metadata = await getVideoMetadata(videoId);
    } catch {
        return NextResponse.json(
            { error: "Failed to fetch video metadata" },
            { status: 500 },
        );
    }

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
        const randomMessage =
            funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        return NextResponse.json({ error: randomMessage }, { status: 400 });
    }

    return NextResponse.json({
        videoInfo: {
            url,
            title: metadata.title,
            thumbnailUrl,
            youtubeId: videoId,
        },
    });
}
