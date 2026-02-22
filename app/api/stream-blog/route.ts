import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
    extractVideoId,
    getVideoMetadata,
    isTheoChannel,
} from "@/lib/youtube";

// Allow streaming responses up to 120 seconds (blogs are longer)
export const maxDuration = 120;

export async function POST(request: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { prompt: url } = await request.json();

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
        return new Response(JSON.stringify({ error: "This app only works with Theo's videos." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    // Normalize YouTube URL for AI
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const blogPrompt = `You are a skilled tech blogger and writer. Given the YouTube video titled "${metadata.title}" by Theo (t3dotgg), write a comprehensive, in-depth blog article that covers ALL the content discussed in the video.

WRITING GUIDELINES:
- Write in a professional but engaging tone, similar to a high-quality tech blog post
- Use Markdown formatting with proper headings (##, ###), bold, italic, code blocks, and lists
- Start with a compelling introduction that hooks the reader
- Break down the content into logical sections with clear headings
- Include technical details, code concepts, and examples where relevant
- Add context and background information that helps readers understand the topic better
- Include the speaker's opinions/takes and frame them appropriately
- End with a strong conclusion summarizing the key message
- Aim for a thorough, detailed article (1000-2500 words depending on video length)
- Do NOT include a title heading (# Title) — the title is shown separately
- Do NOT mention "in this video" or "Theo says in the video" — write it as a standalone article
- Use "Theo" or "the author" when referencing opinions
- Include relevant technical terms and explain them when necessary

FORMAT:
Write the article in clean Markdown. Use ## for main sections, ### for subsections.
Include code examples in fenced code blocks with language tags when relevant.
Use > blockquotes for notable quotes or hot takes from the video.`;

    console.log(`[API/stream-blog] Gemini request for video: ${videoId} at ${new Date().toISOString()}`);

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
        model: googleProvider("gemini-3-flash-preview"),
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
                        text: blogPrompt,
                    },
                ],
            },
        ],
        maxRetries: 0,
    });

    return result.toUIMessageStreamResponse();
}
