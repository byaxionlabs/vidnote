"use server";

// This file previously used deprecated streamObject + createStreamableValue from @ai-sdk/rsc.
// The streaming logic has been moved to:
//   - /api/stream/route.ts (uses streamText + Output.object from the Vercel AI SDK)
//   - /api/videos/validate/route.ts (validates video URL and returns metadata)
// The client now uses useObject from @ai-sdk/react instead of readStreamableValue.

// Re-export types for backwards compatibility
export type { ActionablePoint, ActionablePointsResult } from "@/lib/schemas";

export interface VideoInfo {
	url: string;
	title: string;
	thumbnailUrl: string;
	youtubeId: string;
}
