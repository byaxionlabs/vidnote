import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function extractActionablePoints(youtubeUrl: string, videoTitle?: string) {
    const prompt = `You are an expert at extracting actionable insights from educational content. 

Given the YouTube video${videoTitle ? ` titled "${videoTitle}"` : ""}, extract:
1. **Action Items**: Specific things the viewer should DO after watching
2. **Key Takeaways**: Important facts or concepts to REMEMBER
3. **Insights**: Deeper understanding or "aha moments" from the content

Rules:
- Be specific and concise (max 1-2 sentences per point)
- Focus on practical, implementable advice
- Skip filler content, intros, outros, sponsor segments
- Each point should be self-contained and understandable without context
- Aim for 5-15 total points depending on content length

Return the response in this exact JSON format:
{
  "points": [
    {"content": "Write down your goals every morning", "category": "action"},
    {"content": "Compound interest is the 8th wonder of the world", "category": "remember"},
    {"content": "Success requires consistency over intensity", "category": "insight"}
  ]
}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    fileData: {
                        fileUri: youtubeUrl,
                    },
                },
                { text: prompt },
            ],
        });

        const text = response.text;

        if (!text) {
            throw new Error("No response from AI");
        }

        // Extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("No JSON found in response");
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.points as Array<{ content: string; category: string }>;
    } catch (error) {
        console.error("Error extracting actionable points:", error);
        throw error;
    }
}

// Helper to get transcript from video (if needed for fallback or display)
// export async function getVideoTranscript(youtubeUrl: string): Promise<string> {
//     try {
//         const response = await ai.models.generateContent({
//             model: "gemini-2.0-flash",
//             contents: [
//                 {
//                     fileData: {
//                         fileUri: youtubeUrl,
//                     },
//                 },
//                 { text: "Please provide a full transcript of this video." },
//             ],
//         });

//         return response.text || "";
//     } catch (error) {
//         console.error("Error getting video transcript:", error);
//         throw error;
//     }
// }
