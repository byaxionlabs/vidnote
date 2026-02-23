import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    extractVideoId,
    getVideoMetadata,
    isTheoChannel,
} from "@/lib/youtube";

// Allow streaming responses up to 120 seconds
export const maxDuration = 120;

export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    // Support both { url } (legacy useObject) and { prompt } (useCompletion) formats
    const url = body.url || body.prompt;

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

    // Use plain text streaming format instead of Output.object to enable true
    // incremental streaming. Output.object buffers all JSON before the SDK can
    // start emitting partial objects, whereas plain text streams token-by-token.
    // Each point is emitted on its own line, so the client can parse and render
    // them one at a time as they arrive.
    const textPrompt = `You are an expert at extracting actionable insights from educational content.

Given the YouTube video titled "${metadata.title}", extract actionable insights.

OUTPUT FORMAT — you MUST output EXACTLY one point per line using this format:
[category|timestamp] content

Where:
- category is one of: action, remember, insight
- timestamp is the number of seconds from the start of the video (integer)
- content is the insight text (1-2 sentences max)

Example output:
[action|120] Set up TypeScript strict mode in your tsconfig.json for better type safety.
[remember|245] Next.js App Router uses React Server Components by default.
[insight|380] The trade-off between DX and performance often favors starting with simpler tools.

Rules:
- Output ONLY the formatted lines, nothing else — no preamble, no headers, no numbering
- Be specific and concise (max 1-2 sentences per point)
- Focus on practical, implementable advice
- Skip filler content, intros, outros, sponsor segments
- Each point should be self-contained and understandable without context
- Aim for 5-15 total points depending on content length
- Timestamps should be ACCURATE to where the point is actually discussed in the video
- category meanings: action = things to DO, remember = key facts to REMEMBER, insight = deeper "aha moments"`;


    console.log(`[API/stream] Gemini request for video: ${videoId} at ${new Date().toISOString()}`);

    // Require user-provided API key (BYOK only)
    const userApiKey = request.headers.get("x-gemini-api-key");

    if (!userApiKey) {
        return new Response(
            JSON.stringify({ error: "API key is required. Please add your Gemini API key in the API Key settings on the dashboard." }),
            { status: 400, headers: { "Content-Type": "application/json" } },
        );
    }

    const googleProvider = createGoogleGenerativeAI({ apiKey: userApiKey });

    const result = streamText({
        // gemini-2.0-flash has much higher free tier limits than gemini-2.5-pro
        // Free tier: ~1500 req/day, 15 req/min vs ~25 req/day for 2.5-pro
        model: googleProvider("gemini-3-flash-preview"),
        // No Output.object — plain text streaming for true incremental delivery
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
        onFinish: ({ text }) => {
            console.log(`[API/stream] Full streamed text for video ${videoId}:\n${text}`);
        },
    });

    return result.toTextStreamResponse();
}
