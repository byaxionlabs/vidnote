import { convexToJson, type Value } from "convex/values";
import { getFunctionName } from "convex/server";
import type { ConvexReactClient } from "convex/react";
import type { FunctionArgs, FunctionReference } from "convex/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

// ── Constants ────────────────────────────────────────────────────────────────
export const PREWARM_DEBOUNCE_MS = 120;
export const PREWARM_EXTEND_MS = 8_000;
export const PREWARM_DEDUPE_MS = 3_000;

// ── Types ────────────────────────────────────────────────────────────────────
export type RouteQuerySpec<Query extends FunctionReference<"query">> = {
    query: Query;
    args: FunctionArgs<Query>;
    key: string;
};

// ── Core Utilities ───────────────────────────────────────────────────────────

export function buildQueryKey(queryName: string, args: unknown): string {
    return `${queryName}:${JSON.stringify(convexToJson(args as Value))}`;
}

export function makeRouteQuerySpec<Query extends FunctionReference<"query">>(
    query: Query,
    args: FunctionArgs<Query>,
): RouteQuerySpec<Query> {
    return {
        query,
        args,
        key: buildQueryKey(getFunctionName(query), args),
    };
}

// ── Prewarm Engine ───────────────────────────────────────────────────────────

type PrewarmSpecsOptions = {
    dedupeMs?: number;
    extendSubscriptionFor?: number;
};

const lastPrewarmedAt = new Map<string, number>();

export function prewarmSpecs(
    convex: ConvexReactClient,
    specs: RouteQuerySpec<FunctionReference<"query">>[],
    options: PrewarmSpecsOptions = {},
) {
    const dedupeMs = options.dedupeMs ?? PREWARM_DEDUPE_MS;
    const extendSubscriptionFor =
        options.extendSubscriptionFor ?? PREWARM_EXTEND_MS;
    const now = Date.now();

    for (const spec of specs) {
        const previous = lastPrewarmedAt.get(spec.key);
        if (previous !== undefined && now - previous < dedupeMs) {
            continue; // Skip — already prewarmed recently
        }
        lastPrewarmedAt.set(spec.key, now);
        try {
            convex.prewarmQuery({
                query: spec.query,
                args: spec.args,
                extendSubscriptionFor,
            });
        } catch (error) {
            console.warn("Convex prewarm failed", { key: spec.key, error });
        }
    }
}

// ── Per-Route Prewarm Functions ──────────────────────────────────────────────

/**
 * Prewarm the dashboard route — call this on hover of
 * "Back to Dashboard" links.
 */
export function prewarmDashboard(convex: ConvexReactClient) {
    prewarmSpecs(convex, [
        makeRouteQuerySpec(api.videos.getDashboardVideos, {}),
    ]);
}

/**
 * Prewarm a specific video page — call this on hover of
 * video cards in the dashboard.
 */
export function prewarmVideo(
    convex: ConvexReactClient,
    videoId: string,
) {
    prewarmSpecs(convex, [
        makeRouteQuerySpec(api.videos.getVideoById, {
            videoId: videoId as Id<"videos">,
        }),
    ]);
}
