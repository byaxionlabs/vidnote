import { QueryClient } from "@tanstack/react-query";
import {
    videoQueryKey,
    dashboardQueryKey,
    fetchVideoById,
    fetchDashboard,
} from "./queries";

// ─── Prefetch Helpers ────────────────────────────────────────────────────────
// These are plain functions (not hooks) so they can be called from event
// handlers, callbacks, or anywhere you have access to a queryClient.

/**
 * Prefetch a single video's data into the React Query cache.
 * Called on hover over a video card so the data is ready before the click.
 *
 * Uses `prefetchQuery` which is a no-op if the data is already cached
 * and fresh (within staleTime). This means rapid mouse movements over
 * the same card won't trigger duplicate fetches.
 */
export function prefetchVideo(queryClient: QueryClient, videoId: string) {
    queryClient.prefetchQuery({
        queryKey: videoQueryKey(videoId),
        queryFn: () => fetchVideoById(videoId),
        // Only refetch if cached data is older than 2 minutes
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Prefetch the dashboard video list into cache.
 * Called when the video detail page mounts so navigating "back" is instant.
 */
export function prefetchDashboard(queryClient: QueryClient, userId: string) {
    queryClient.prefetchQuery({
        queryKey: dashboardQueryKey(userId),
        queryFn: fetchDashboard,
        staleTime: 2 * 60 * 1000,
    });
}
