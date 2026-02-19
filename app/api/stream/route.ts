import { streamObject } from "ai";
import { google } from "@ai-sdk/google";
import { actionablePointsSchema } from "@/lib/schemas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    extractVideoId,
    getVideoMetadata,
    isTheoChannel,
} from "@/lib/youtube";

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
        return new Response(JSON.stringify({ error: "URL is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
        return new Response(JSON.stringify({ error: "Invalid YouTube URL" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Get video metadata
    let metadata;
    try {
        metadata = await getVideoMetadata(videoId);
    } catch (err) {
        return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Failed to fetch video metadata" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
        );
    }


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
        return new Response(JSON.stringify({ error: randomMessage }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Normalize YouTube URL for AI
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const textPrompt = `You are an expert at extracting actionable insights from educational content. 

Given the YouTube video titled "${metadata.title}", extract:
1. **Action Items**: Specific things the viewer should DO after watching
2. **Key Takeaways**: Important facts or concepts to REMEMBER
3. **Insights**: Deeper understanding or "aha moments" from the content

IMPORTANT: For each point, also provide the timestamp (in seconds from the start of the video) where this point is discussed. This helps users verify the information.

Rules:
- Be specific and concise (max 1-2 sentences per point)
- Focus on practical, implementable advice
- Skip filler content, intros, outros, sponsor segments
- Each point should be self-contained and understandable without context
- Aim for 5-15 total points depending on content length
- Timestamps should be ACCURATE to where the point is actually discussed in the video`;


    console.log(`[API/stream] Gemini request for video: ${videoId} at ${new Date().toISOString()}`);

    const result = streamObject({
        // gemini-2.0-flash has much higher free tier limits than gemini-2.5-pro
        // Free tier: ~1500 req/day, 15 req/min vs ~25 req/day for 2.5-pro
        model: google("gemini-3-flash-preview"),
        schema: actionablePointsSchema,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "file",
                        data: youtubeUrl,
                        mediaType: "video/mp4",
                    },
                    {
                        type: "text",
                        text: textPrompt,
                    },
                ],
            },
        ],
        // Disable auto-retries: on 429 (rate limit), retrying just burns more quota
        maxRetries: 0,
    });
    // Drain the object promise to prevent unhandled rejection
    result.object.catch(() => { });

    // Build the response stream manually instead of using toTextStreamResponse()
    // which has a bug that double-closes the controller causing ERR_INVALID_STATE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of result.textStream) {
                    controller.enqueue(encoder.encode(chunk));
                }
            } catch {
                // Stream interrupted (e.g. client disconnected) — ignore
            } finally {
                try {
                    controller.close();
                } catch {
                    // Already closed — ignore
                }
            }
        },
    });

    return new Response(stream, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}
