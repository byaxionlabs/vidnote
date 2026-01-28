import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^[a-zA-Z0-9_-]{11}$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1] || match[0];
        }
    }
    return null;
}

export function getYouTubeThumbnail(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export async function getYouTubeTranscript(videoId: string): Promise<string> {
    try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptItems.map((item) => item.text).join(" ");
    } catch (error) {
        console.error("Error fetching transcript:", error);
        throw new Error(
            "Could not fetch transcript. Make sure the video has captions enabled."
        );
    }
}

export async function getVideoMetadata(videoId: string): Promise<{ title: string }> {
    // Use oEmbed API to get video title (no API key required)
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) {
            throw new Error("Could not fetch video metadata");
        }

        const data = await response.json();
        return { title: data.title };
    } catch (error) {
        console.error("Error fetching video metadata:", error);
        return { title: "Untitled Video" };
    }
}
