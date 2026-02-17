"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    ExternalLink,
    Target,
    Lightbulb,
    Loader2,
    Sparkles,
    Brain,
    Zap,
    Play,
    Clock,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { ActionablePoint } from "@/lib/schemas";

// Video metadata returned from validate endpoint
interface VideoInfo {
    url: string;
    title: string;
    thumbnailUrl: string;
    youtubeId: string;
}

// Helper to format seconds to MM:SS
function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Attempt to repair incomplete JSON by closing open brackets/braces/strings
function tryRepairJson(text: string): string | null {
    if (!text.trim()) return null;

    let repaired = text.trim();

    // Remove trailing commas before we close brackets
    repaired = repaired.replace(/,\s*$/, "");

    // Track what needs to be closed
    const stack: string[] = [];
    let inString = false;
    let escape = false;

    for (let i = 0; i < repaired.length; i++) {
        const ch = repaired[i];

        if (escape) {
            escape = false;
            continue;
        }

        if (ch === "\\") {
            escape = true;
            continue;
        }

        if (ch === '"') {
            inString = !inString;
            continue;
        }

        if (inString) continue;

        if (ch === "{") stack.push("}");
        else if (ch === "[") stack.push("]");
        else if (ch === "}" || ch === "]") {
            if (stack.length > 0 && stack[stack.length - 1] === ch) {
                stack.pop();
            }
        }
    }

    // If we're still in a string, close it
    if (inString) {
        repaired += '"';
    }

    // Remove trailing commas again after potential string close
    repaired = repaired.replace(/,\s*$/, "");

    // Close all open brackets/braces
    while (stack.length > 0) {
        repaired += stack.pop();
    }

    return repaired;
}

// Generate a stable key for a point based on its content
function getPointKey(point: ActionablePoint, index: number): string {
    // Use content hash as key so existing cards don't re-mount when new ones arrive
    return `${point.category}-${point.content.slice(0, 40)}-${index}`;
}

function StreamingContent() {
    const searchParams = useSearchParams();
    const { data: session, isPending } = useSession();
    const router = useRouter();

    const url = searchParams.get("url");

    const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
    const [streamingPoints, setStreamingPoints] = useState<ActionablePoint[]>([]);
    const [phase, setPhase] = useState<"loading" | "streaming" | "saving" | "done" | "error">("loading");
    const [error, setError] = useState("");

    const hasStartedRef = useRef(false);

    // Throttle UI updates during streaming to avoid excessive re-renders
    const pendingPointsRef = useRef<ActionablePoint[]>([]);
    const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flushPoints = () => {
        if (pendingPointsRef.current.length > 0) {
            setStreamingPoints([...pendingPointsRef.current]);
        }
        updateTimerRef.current = null;
    };

    const schedulePointsUpdate = (points: ActionablePoint[]) => {
        pendingPointsRef.current = points;
        if (!updateTimerRef.current) {
            updateTimerRef.current = setTimeout(flushPoints, 150); // Max 6-7 updates/sec
        }
    };

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session || !url || hasStartedRef.current) return;
        hasStartedRef.current = true;

        let cancelled = false;
        const abortController = new AbortController();

        const run = async () => {
            setPhase("loading");

            try {
                // Step 1: Validate the video URL and get metadata
                const validateRes = await fetch("/api/videos/validate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                    signal: abortController.signal,
                });

                if (cancelled) return;

                const validateData = await validateRes.json();

                if (!validateRes.ok) {
                    setError(validateData.error || "Invalid video");
                    setPhase("error");
                    return;
                }

                const info: VideoInfo = validateData.videoInfo;
                setVideoInfo(info);
                setPhase("streaming");

                // Step 2: Stream AI extraction
                const streamRes = await fetch("/api/stream", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url }),
                    signal: abortController.signal,
                });

                if (cancelled) return;

                if (!streamRes.ok || !streamRes.body) {
                    const errData = await streamRes.json().catch(() => ({}));
                    setError(errData.error || "Failed to start extraction");
                    setPhase("error");
                    return;
                }

                const reader = streamRes.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedText = "";
                let lastValidPoints: ActionablePoint[] = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done || cancelled) break;

                    accumulatedText += decoder.decode(value, { stream: true });

                    try {
                        const parsed = JSON.parse(accumulatedText);
                        if (parsed?.points) {
                            const validPoints = parsed.points.filter(
                                (p: Partial<ActionablePoint> | undefined): p is ActionablePoint =>
                                    p !== undefined &&
                                    typeof p.content === "string" &&
                                    (p.content as string).length > 0 &&
                                    typeof p.category === "string"
                            );
                            lastValidPoints = validPoints;
                            if (!cancelled) schedulePointsUpdate(validPoints);
                        }
                    } catch {
                        const repaired = tryRepairJson(accumulatedText);
                        if (repaired) {
                            try {
                                const parsed = JSON.parse(repaired);
                                if (parsed?.points) {
                                    const validPoints = parsed.points.filter(
                                        (p: Partial<ActionablePoint> | undefined): p is ActionablePoint =>
                                            p !== undefined &&
                                            typeof p.content === "string" &&
                                            (p.content as string).length > 0 &&
                                            typeof p.category === "string"
                                    );
                                    if (validPoints.length > lastValidPoints.length) {
                                        lastValidPoints = validPoints;
                                        if (!cancelled) schedulePointsUpdate(validPoints);
                                    }
                                }
                            } catch {
                                // Still unparseable
                            }
                        }
                    }
                }

                // Final flush
                accumulatedText += decoder.decode();
                if (updateTimerRef.current) {
                    clearTimeout(updateTimerRef.current);
                    updateTimerRef.current = null;
                }

                // Final parse attempt
                if (lastValidPoints.length === 0 && accumulatedText.trim().length > 0) {
                    try {
                        const finalParsed = JSON.parse(accumulatedText);
                        if (finalParsed?.points) {
                            lastValidPoints = finalParsed.points.filter(
                                (p: Partial<ActionablePoint> | undefined): p is ActionablePoint =>
                                    p !== undefined &&
                                    typeof p.content === "string" &&
                                    (p.content as string).length > 0 &&
                                    typeof p.category === "string"
                            );
                        }
                    } catch {
                        // noop
                    }
                }

                if (cancelled) return;
                // Flush final points immediately
                if (lastValidPoints.length > 0) {
                    setStreamingPoints([...lastValidPoints]);
                }

                // Step 3: Save to database
                if (lastValidPoints.length > 0) {
                    setPhase("saving");

                    const saveRes = await fetch("/api/videos/save", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            url: info.url,
                            videoId: info.youtubeId,
                            title: info.title,
                            thumbnailUrl: info.thumbnailUrl,
                            points: lastValidPoints,
                        }),
                    });

                    if (cancelled) return;

                    const saveData = await saveRes.json();

                    if (!saveRes.ok) {
                        setError(saveData.error || "Failed to save video");
                        setPhase("error");
                        return;
                    }

                    setPhase("done");
                    router.replace(`/video/${saveData.video.id}`);
                } else {
                    setError("No insights were extracted from this video. Please try again.");
                    setPhase("error");
                }
            } catch (err) {
                if (!cancelled) {
                    if (err instanceof DOMException && err.name === "AbortError") return;
                    setError(err instanceof Error ? err.message : "Something went wrong");
                    setPhase("error");
                }
            }
        };

        run();

        return () => {
            cancelled = true;
            abortController.abort();
            if (updateTimerRef.current) {
                clearTimeout(updateTimerRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, url]);

    // Memoize grouped points so they don't recalculate on unrelated state changes
    const groupedPoints = useMemo(() => ({
        action: streamingPoints.filter((p) => p.category === "action"),
        remember: streamingPoints.filter((p) => p.category === "remember"),
        insight: streamingPoints.filter((p) => p.category === "insight"),
    }), [streamingPoints]);

    // Auth loading
    if (isPending || !session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="loader"></div>
            </div>
        );
    }

    if (!url) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
                <div className="text-center animate-in fade-in duration-500">
                    <h1 className="text-3xl mb-4 text-foreground">No Video URL</h1>
                    <p className="text-muted-foreground mb-8">Please provide a video URL to analyze.</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (phase === "error") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
                <div className="text-center animate-in fade-in duration-500 max-w-lg">
                    <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto mb-6">
                        <Zap size={32} className="text-destructive" />
                    </div>
                    <h1 className="text-2xl mb-4 text-foreground">Oops!</h1>
                    <p className="text-muted-foreground mb-8">{error}</p>
                    <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all">
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const isStreaming = phase === "streaming";
    const isSaving = phase === "saving";

    return (
        <div className="min-h-screen bg-background">
            {/* Decorative Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-primary/3 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex items-center justify-between h-18 py-4">
                        <Link href="/dashboard" className="flex items-center gap-3 group">
                            <span className="text-2xl font-bold text-foreground font-serif italic">Theo Notes</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            {videoInfo && (
                                <a
                                    href={`https://www.youtube.com/watch?v=${videoInfo.youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2.5 flex items-center gap-2 border border-border rounded-xl text-foreground hover:bg-accent hover:border-primary/50 transition-all"
                                >
                                    <ExternalLink size={16} />
                                    <span className="hidden sm:inline">Watch Video</span>
                                </a>
                            )}
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
                {/* Back Button */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Link>

                {/* Video Hero Section */}
                <div className="bg-card border border-border rounded-3xl overflow-hidden mb-10 shadow-lg">
                    <div className="flex flex-col lg:flex-row">
                        {/* Thumbnail */}
                        <div className="lg:w-2/5 relative overflow-hidden bg-muted">
                            {videoInfo?.thumbnailUrl ? (
                                <Image
                                    src={videoInfo.thumbnailUrl}
                                    alt={videoInfo.title || "Video thumbnail"}
                                    width={480}
                                    height={270}
                                    className="w-full h-full object-cover min-h-[200px]"
                                />
                            ) : (
                                <div className="w-full min-h-[200px] flex items-center justify-center bg-muted">
                                    <div className="text-center">
                                        <Sparkles size={32} className="text-muted-foreground/50 mx-auto mb-2" />
                                        <p className="text-sm text-muted-foreground">Loading video...</p>
                                    </div>
                                </div>
                            )}
                            {/* Streaming Badge */}
                            {isStreaming && (
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-2 shadow-lg">
                                    <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></span>
                                    LIVE EXTRACTING
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 p-6 lg:p-8 flex flex-col">
                            <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-3">
                                <span>@t3dotgg</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">Theo&apos;s Channel</span>
                            </div>

                            <h1 className="text-2xl lg:text-3xl mb-4 text-foreground leading-snug min-h-[2rem]">
                                {videoInfo?.title || "Preparing video analysis..."}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                                <span className="flex items-center gap-2 text-primary">
                                    <Sparkles size={15} />
                                    <span className="font-medium">
                                        {streamingPoints.length} note{streamingPoints.length !== 1 ? "s" : ""}{" "}
                                        {isStreaming ? "extracting..." : "extracted"}
                                    </span>
                                </span>
                            </div>

                            {/* Status Section */}
                            <div className="mt-auto bg-muted/50 rounded-2xl p-5 border border-border">
                                <div className="flex items-center gap-3">
                                    {phase === "loading" && (
                                        <>
                                            <Loader2 size={20} className="animate-spin text-primary" />
                                            <span className="font-medium text-foreground">Validating video...</span>
                                        </>
                                    )}
                                    {isStreaming && (
                                        <>
                                            <Loader2 size={20} className="animate-spin text-primary" />
                                            <span className="font-medium text-foreground">AI is extracting insights...</span>
                                        </>
                                    )}
                                    {isSaving && (
                                        <>
                                            <Loader2 size={20} className="animate-spin text-primary" />
                                            <span className="font-medium text-foreground">Saving your notes...</span>
                                        </>
                                    )}
                                    {phase === "done" && (
                                        <>
                                            <Sparkles size={20} className="text-primary" />
                                            <span className="font-medium text-foreground">Extraction complete!</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Insights Grid */}
                {streamingPoints.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Action Items + Insights */}
                        <div className="space-y-8">
                            {groupedPoints.action.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                                            <Target size={24} className="text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-foreground">Action Items</h2>
                                            <p className="text-sm text-muted-foreground">Things to do</p>
                                        </div>
                                        <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/30">
                                            {groupedPoints.action.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {groupedPoints.action.map((point, index) => (
                                            <PointCard
                                                key={getPointKey(point, index)}
                                                point={point}
                                                colorClass="primary"
                                                videoId={videoInfo?.youtubeId}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {groupedPoints.insight.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-chart-3/10 border border-chart-3/30 flex items-center justify-center">
                                            <Lightbulb size={24} className="text-chart-3" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-foreground">Insights</h2>
                                            <p className="text-sm text-muted-foreground">Aha moments</p>
                                        </div>
                                        <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-chart-3/10 text-chart-3 border border-chart-3/30">
                                            {groupedPoints.insight.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {groupedPoints.insight.map((point, index) => (
                                            <PointCard
                                                key={getPointKey(point, index)}
                                                point={point}
                                                colorClass="chart-3"
                                                videoId={videoInfo?.youtubeId}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right Column - Key Takeaways */}
                        <div className="space-y-8">
                            {groupedPoints.remember.length > 0 && (
                                <section>
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-12 h-12 rounded-2xl bg-chart-2/10 border border-chart-2/30 flex items-center justify-center">
                                            <Brain size={24} className="text-chart-2" />
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold text-foreground">Key Takeaways</h2>
                                            <p className="text-sm text-muted-foreground">Remember these</p>
                                        </div>
                                        <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full bg-chart-2/10 text-chart-2 border border-chart-2/30">
                                            {groupedPoints.remember.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3">
                                        {groupedPoints.remember.map((point, index) => (
                                            <PointCard
                                                key={getPointKey(point, index)}
                                                point={point}
                                                colorClass="chart-2"
                                                videoId={videoInfo?.youtubeId}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}

                {/* Empty State while loading/streaming */}
                {streamingPoints.length === 0 && (phase === "loading" || isStreaming) && (
                    <div className="text-center py-16">
                        <Loader2 size={48} className="animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">
                            {phase === "loading" ? "Preparing video analysis..." : "Watching the video and extracting insights..."}
                        </p>
                        <p className="text-muted-foreground text-sm mt-2">This may take a moment for longer videos</p>
                    </div>
                )}
            </main>
        </div>
    );
}

interface PointCardProps {
    point: ActionablePoint;
    colorClass: string;
    videoId?: string;
}

const borderColorMap: Record<string, string> = {
    "primary": "border-l-primary",
    "chart-2": "border-l-chart-2",
    "chart-3": "border-l-chart-3",
};

const badgeColorMap: Record<string, string> = {
    "primary": "bg-primary/10 text-primary border-primary/30",
    "chart-2": "bg-chart-2/10 text-chart-2 border-chart-2/30",
    "chart-3": "bg-chart-3/10 text-chart-3 border-chart-3/30",
};

function PointCard({ point, colorClass, videoId }: PointCardProps) {
    return (
        <div
            className={`bg-card border border-border rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30 border-l-4 ${borderColorMap[colorClass]}`}
        >
            <div className="flex items-start gap-4">
                {/* Circle indicator */}
                <div className="pt-1 shrink-0">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-base leading-relaxed text-foreground">
                        {point.content}
                    </p>

                    {/* Timestamp & badge */}
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {point.timestamp && videoId && (
                            <a
                                href={`https://www.youtube.com/watch?v=${videoId}&t=${point.timestamp}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
                            >
                                <Play size={12} fill="currentColor" />
                                Watch at {formatTimestamp(point.timestamp)}
                            </a>
                        )}
                        {point.timestamp && !videoId && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground">
                                <Clock size={12} />
                                {formatTimestamp(point.timestamp)}
                            </span>
                        )}
                        <span className={`hidden sm:inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border ${badgeColorMap[colorClass]}`}>
                            {point.category}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function StreamingPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 size={32} className="animate-spin text-primary" />
            </div>
        }>
            <StreamingContent />
        </Suspense>
    );
}
