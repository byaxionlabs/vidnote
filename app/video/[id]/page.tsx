"use client";

import { useState, useEffect, useRef, useMemo, use, useCallback, Suspense } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.min.css";
import { useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { experimental_useObject as useObject, useCompletion } from "@ai-sdk/react";
import { actionablePointsSchema, type ActionablePoint } from "@/lib/schemas";
import { loadApiKey } from "@/lib/api-key";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Target,
  CheckCircle2,
  Lightbulb,
  Trash2,
  Loader2,
  Clock,
  Sparkles,
  Trophy,
  Brain,
  Zap,
  Play,
  X,
  Video,
  FileText,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface VideoPoint {
  id: string;
  content: string;
  category: string;
  timestamp: number | null;
  isCompleted: boolean;
  order: number;
}

interface VideoData {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  createdAt: string;
}

// Helper to format seconds to MM:SS
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getPointKey(point: ActionablePoint | VideoPoint, index: number): string {
  return `${point.category}-${point.content.slice(0, 40)}-${index}`;
}

// ─── Highlighted Code Block Component ──────────────────────────────────────
// Uses highlight.js for syntax highlighting with a ref to avoid SSR issues

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // Reset any previous highlighting
      codeRef.current.removeAttribute("data-highlighted");
      hljs.highlightElement(codeRef.current);
    }
  }, [code, language]);

  return (
    <pre className="blog-code-block">
      <div className="blog-code-lang">{language || "code"}</div>
      <code ref={codeRef} className={language ? `language-${language}` : ""}>
        {code}
      </code>
    </pre>
  );
}


// ─── Simple Markdown Renderer ──────────────────────────────────────────────
// Converts markdown text to React elements without external dependencies

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeBlockLang = "";
  let listItems: React.ReactNode[] = [];
  let inBlockquote = false;
  let blockquoteContent: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="blog-list">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const flushBlockquote = () => {
    if (blockquoteContent.length > 0) {
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="blog-blockquote">
          {formatInline(blockquoteContent.join(" "))}
        </blockquote>
      );
      blockquoteContent = [];
      inBlockquote = false;
    }
  };

  const formatInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Process bold, italic, inline code, and links
    const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (match[2]) {
        // Bold italic ***text***
        parts.push(<strong key={match.index}><em>{match[2]}</em></strong>);
      } else if (match[3]) {
        // Bold **text**
        parts.push(<strong key={match.index}>{match[3]}</strong>);
      } else if (match[4]) {
        // Italic *text*
        parts.push(<em key={match.index}>{match[4]}</em>);
      } else if (match[5]) {
        // Inline code `code`
        parts.push(<code key={match.index} className="blog-inline-code">{match[5]}</code>);
      } else if (match[6] && match[7]) {
        // Link [text](url)
        parts.push(
          <a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer" className="blog-link">
            {match[6]}
          </a>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code blocks
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        const codeKey = `code-${elements.length}`;
        const codeLang = codeBlockLang;
        const codeText = codeBlockContent.join("\n");
        elements.push(
          <HighlightedCode key={codeKey} code={codeText} language={codeLang} />
        );
        codeBlockContent = [];
        codeBlockLang = "";
        inCodeBlock = false;
      } else {
        flushList();
        flushBlockquote();
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      flushList();
      flushBlockquote();
      continue;
    }

    // Blockquote
    if (line.trimStart().startsWith("> ")) {
      flushList();
      inBlockquote = true;
      blockquoteContent.push(line.trimStart().slice(2));
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="blog-h3">{formatInline(line.slice(4))}</h3>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="blog-h2">{formatInline(line.slice(3))}</h2>
      );
      continue;
    }

    // Horizontal rule
    if (line.trim() === "---" || line.trim() === "***") {
      flushList();
      elements.push(<hr key={`hr-${i}`} className="blog-hr" />);
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s/.test(line)) {
      const content = line.replace(/^\s*[-*]\s/, "");
      listItems.push(
        <li key={`li-${i}`}>{formatInline(content)}</li>
      );
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const content = line.replace(/^\s*\d+\.\s/, "");
      listItems.push(
        <li key={`li-${i}`}>{formatInline(content)}</li>
      );
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="blog-paragraph">{formatInline(line)}</p>
    );
  }

  flushList();
  flushBlockquote();

  return elements;
}


// ─── Main Page (wraps with Suspense for useSearchParams) ───────────────────

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      }
    >
      <VideoContent id={id} />
    </Suspense>
  );
}

// ─── Core Component ────────────────────────────────────────────────────────

function VideoContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const shouldExtract = searchParams.get("extract") === "true";

  // ── State ──────────────────────────────────────────────────────────────

  const [video, setVideo] = useState<VideoData | null>(null);
  const [points, setPoints] = useState<VideoPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Streaming state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionPhase, setExtractionPhase] = useState<
    "idle" | "streaming" | "saving" | "done" | "error"
  >("idle");

  // Blog persistence state (the streaming text comes from useCompletion below)
  const [blogContent, setBlogContent] = useState<string | null>(null);
  const [blogSaved, setBlogSaved] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<"notes" | "blog">("notes");

  // Interaction state
  const [updatingPoint, setUpdatingPoint] = useState<string | null>(null);
  const [previewPoint, setPreviewPoint] = useState<VideoPoint | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Auth tracking
  const hasAuthenticatedRef = useRef(false);
  if (session) hasAuthenticatedRef.current = true;

  const hasStartedExtractionRef = useRef(false);
  const hasStartedBlogRef = useRef(false);

  // ── BYOK: load user's API key ─────────────────────────────────────────
  // Use state (not just a ref) so that useObject/useCompletion hooks
  // re-initialise with the correct headers once the key is decrypted.

  const [userApiKey, setUserApiKey] = useState<string | null>(null);
  const userApiKeyRef = useRef<string | null>(null);

  const loadUserApiKey = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const key = await loadApiKey(session.user.id);
      userApiKeyRef.current = key;
      setUserApiKey(key);
    } catch {
      userApiKeyRef.current = null;
      setUserApiKey(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadUserApiKey();
  }, [loadUserApiKey]);

  // Compute headers reactively so hooks always get the latest key
  const apiKeyHeaders = useMemo(
    () => (userApiKey ? { "x-gemini-api-key": userApiKey } : undefined),
    [userApiKey],
  );

  // ── useObject for streaming AI extraction ──────────────────────────────
  // The AI SDK's useObject hook handles incremental JSON parsing, partial
  // object streaming, type safety, and render optimisation automatically.

  const { object, submit, stop } = useObject({
    api: "/api/stream",
    schema: actionablePointsSchema,
    headers: apiKeyHeaders,
    onFinish: async ({ object: finalObject, error: finishError }) => {
      if (finishError) {
        setError(finishError.message || "Failed to extract insights");
        setExtractionPhase("error");
        return;
      }

      const validPoints = (finalObject?.points ?? []).filter(
        (p): p is ActionablePoint =>
          !!p &&
          typeof p.content === "string" &&
          p.content.length > 0 &&
          typeof p.category === "string",
      );

      if (validPoints.length === 0) {
        setError("No insights were extracted from this video. Please try again.");
        setExtractionPhase("error");
        return;
      }

      // Save points to the database
      setExtractionPhase("saving");
      try {
        const saveRes = await fetch(`/api/videos/${id}/points`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: validPoints }),
        });

        if (!saveRes.ok) {
          const saveData = await saveRes.json();
          setError(saveData.error || "Failed to save notes");
          setExtractionPhase("error");
          return;
        }

        const saveData = await saveRes.json();

        setPoints(saveData.points);
        setExtractionPhase("done");
        setIsExtracting(false);

        window.history.replaceState({}, "", `/video/${id}`);
      } catch {
        setError("Failed to save notes. Please try again.");
        setExtractionPhase("error");
      }
    },
    onError: (err) => {
      // Parse error for user-friendly messages
      const msg = err.message || "";
      let errorMsg: string;
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
        errorMsg = "Rate limit reached. The Gemini API free tier has usage limits. Please wait a minute and try again.";
        toast.error("Rate limit reached", {
          description: "The Gemini API free tier has usage limits. Please wait a minute and try again.",
        });
      } else if (msg.includes("API key")) {
        errorMsg = msg;
        toast.error("API key error", { description: msg });
      } else if (msg.includes("401") || msg.includes("403") || msg.toLowerCase().includes("unauthorized") || msg.toLowerCase().includes("invalid")) {
        errorMsg = "Your API key appears to be invalid. Please check your key in the API Key settings on the dashboard.";
        toast.error("Invalid API key", {
          description: "Please check your key in the API Key settings on the dashboard.",
        });
      } else {
        errorMsg = msg || "Failed to extract insights. Please try again.";
        toast.error("Extraction failed", { description: errorMsg });
      }
      setError(errorMsg);
      setExtractionPhase("error");
    },
  });

  // High watermark ref to prevent points from flashing away during stream finalization
  const lastValidPointsRef = useRef<ActionablePoint[]>([]);

  const streamingPoints = useMemo(() => {
    const validPoints = (object?.points ?? []).filter(
      (p): p is ActionablePoint =>
        !!p &&
        typeof p.content === "string" &&
        p.content.length > 0 &&
        typeof p.category === "string",
    );
    if (validPoints.length >= lastValidPointsRef.current.length) {
      lastValidPointsRef.current = validPoints;
    }
    return lastValidPointsRef.current;
  }, [object?.points]);

  // ── Blog streaming via useCompletion ──────────────────────────────────
  // The AI SDK’s useCompletion hook handles text streaming, loading state,
  // error handling, cancellation, and throttling automatically.

  const {
    completion: blogStreamingText,
    complete: blogComplete,
    isLoading: isBlogStreaming,
  } = useCompletion({
    api: "/api/stream-blog",
    headers: apiKeyHeaders,
    onFinish: async (_prompt, completion) => {
      setBlogContent(completion);

      // Save the blog to the database
      try {
        await fetch(`/api/videos/${id}/blog`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blogContent: completion }),
        });
        setBlogSaved(true);
      } catch {
        console.error("Failed to save blog content");
      }
    },
    onError: (err) => {
      const msg = err.message || "";
      if (msg.includes("429") || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("quota")) {
        toast.error("Blog rate limited", {
          description: "Rate limit reached for blog generation. Try again later.",
        });
      } else {
        toast.error("Blog generation failed", {
          description: msg || "Something went wrong while generating the blog article.",
        });
      }
    },
  });

  // ── Derived data ───────────────────────────────────────────────────────

  // Use streamed points while extracting, DB points when done
  const displayPoints: (ActionablePoint | VideoPoint)[] =
    isExtracting && streamingPoints.length > 0 ? streamingPoints : points;

  const groupedPoints = useMemo(
    () => ({
      action: displayPoints.filter((p) => p.category === "action"),
      remember: displayPoints.filter((p) => p.category === "remember"),
      insight: displayPoints.filter((p) => p.category === "insight"),
    }),
    [displayPoints],
  );

  const completedCount = points.filter((p) => p.isCompleted).length;
  const progress = points.length > 0 ? (completedCount / points.length) * 100 : 0;

  // The blog text to display — streaming text while active, else saved content
  const displayBlogText = blogStreamingText || blogContent;

  // ── Effects ────────────────────────────────────────────────────────────

  // Auth redirect
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  // Fetch video data
  const isAuthenticated = !!session;

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${id}`);
        if (!res.ok) throw new Error("Video not found");

        const data = await res.json();
        setVideo(data.video);

        // Load saved blog content if available
        if (data.blogContent) {
          setBlogContent(data.blogContent);
          setBlogSaved(true);
        }

        // Only set points from DB if we're not about to extract
        if (!shouldExtract || data.points.length > 0) {
          setPoints(data.points);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, id]);

  // Start extraction when extract=true, video data is loaded, AND the API key
  // has been decrypted and is available. Without the `userApiKey` guard the
  // useObject / useCompletion hooks would fire before the headers contain the key.
  useEffect(() => {
    if (
      !shouldExtract ||
      !video ||
      loading ||
      !userApiKey || // Wait for the API key to be loaded & decrypted
      hasStartedExtractionRef.current ||
      points.length > 0 // Already has points — don't re-extract
    ) {
      return;
    }

    hasStartedExtractionRef.current = true;
    setIsExtracting(true);
    setExtractionPhase("streaming");

    // Fire both streams in parallel
    submit({ url: video.youtubeUrl });

    if (!hasStartedBlogRef.current) {
      hasStartedBlogRef.current = true;
      blogComplete(video.youtubeUrl);
    }

    return () => {
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldExtract, video, loading, userApiKey]);

  // ── Handlers ───────────────────────────────────────────────────────────

  const togglePoint = async (pointId: string, isCompleted: boolean) => {
    setUpdatingPoint(pointId);
    try {
      await fetch(`/api/videos/${id}/points/${pointId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      setPoints(
        points.map((p) =>
          p.id === pointId ? { ...p, isCompleted: !isCompleted } : p,
        ),
      );
    } catch (err) {
      console.error("Error updating point:", err);
    } finally {
      setUpdatingPoint(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }
      toast.success("Video deleted", {
        description: "The video and all its notes have been removed.",
      });
      router.push("/dashboard");
    } catch (err) {
      console.error("Error deleting video:", err);
      const errMsg = err instanceof Error ? err.message : "Failed to delete video. Please try again.";
      setDeleteError(errMsg);
      toast.error("Failed to delete", { description: errMsg });
    } finally {
      setDeleting(false);
    }
  };

  // ── Early returns ──────────────────────────────────────────────────────

  // Auth loading — only on initial load
  if ((isPending || !session) && !hasAuthenticatedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loader"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center h-18 py-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground font-serif italic">
                  Theo Notes
                </span>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8"></div>
          <div className="aspect-video bg-muted animate-pulse rounded-2xl mb-10"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse rounded-xl"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if ((error && !isExtracting) || !video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center mx-auto mb-6">
            <Zap size={32} className="text-muted-foreground" />
          </div>
          <h1 className="text-3xl mb-4 text-foreground">
            {error ? "Oops!" : "Video Not Found"}
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            {error ||
              "This video doesn't exist or you don't have access to it."}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  const showStreamingUI = isExtracting && extractionPhase === "streaming";
  const showSavingUI = extractionPhase === "saving";
  const totalDisplayPoints = displayPoints.length;

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
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
            >
              <span className="text-2xl font-bold text-foreground font-serif italic">
                Theo Notes
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 flex items-center gap-2 border border-border rounded-xl text-foreground hover:bg-accent hover:border-primary/50 transition-all"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">Watch Video</span>
              </a>
              <ThemeToggle />
              {!isExtracting && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-all"
                  title="Delete Video"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group animate-in fade-in duration-300"
        >
          <ArrowLeft
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Dashboard
        </Link>

        {/* Video Hero Section */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden mb-10 shadow-lg animate-in fade-in slide-in-from-bottom duration-500">
          <div className="flex flex-col lg:flex-row">
            {/* Thumbnail */}
            <div className="lg:w-2/5 relative overflow-hidden">
              <Image
                src={video.thumbnailUrl}
                alt={video.title || "Video thumbnail"}
                width={480}
                height={270}
                className="w-full h-full object-cover min-h-[200px]"
              />
              {/* Streaming Badge */}
              {showStreamingUI && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></span>
                  LIVE EXTRACTING
                </div>
              )}
              {/* Play Button Overlay (only when not streaming) */}
              {!isExtracting && (
                <div className="absolute inset-0 bg-gradient-to-br from-background/30 to-transparent flex items-center justify-center">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                  >
                    <Play
                      size={24}
                      className="text-primary-foreground ml-1"
                      fill="currentColor"
                    />
                  </a>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col">
              <div className="flex items-center gap-2 text-xs text-primary font-medium uppercase tracking-wider mb-3">
                <span>@t3dotgg</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Theo&apos;s Channel
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl mb-4 text-foreground leading-snug">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                {!isExtracting && (
                  <span className="flex items-center gap-2">
                    <Clock size={15} />
                    {new Date(video.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
                <span className="flex items-center gap-2 text-primary">
                  <Sparkles size={15} />
                  <span className="font-medium">
                    {totalDisplayPoints} note
                    {totalDisplayPoints !== 1 ? "s" : ""}{" "}
                    {showStreamingUI ? "extracting..." : "extracted"}
                  </span>
                </span>
              </div>

              {/* Status Section */}
              <div className="mt-auto bg-muted/50 rounded-2xl p-5 border border-border">
                {/* Streaming statuses */}
                {showStreamingUI && (
                  <div className="flex items-center gap-3">
                    <Loader2
                      size={20}
                      className="animate-spin text-primary"
                    />
                    <span className="font-medium text-foreground">
                      AI is extracting insights...
                    </span>
                  </div>
                )}
                {showSavingUI && (
                  <div className="flex items-center gap-3">
                    <Loader2
                      size={20}
                      className="animate-spin text-primary"
                    />
                    <span className="font-medium text-foreground">
                      Saving your notes...
                    </span>
                  </div>
                )}
                {extractionPhase === "error" && error && (
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-destructive" />
                    <span className="font-medium text-destructive">
                      {error}
                    </span>
                  </div>
                )}

                {/* Normal progress (when not streaming) */}
                {!isExtracting && extractionPhase !== "error" && (
                  <>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <Trophy size={16} className="text-primary" />
                        <span className="font-medium text-foreground">
                          Your Progress
                        </span>
                      </div>
                      <span className="text-primary font-bold text-lg">
                        {completedCount}/{points.length}
                      </span>
                    </div>
                    <div className="h-3 bg-background rounded-full overflow-hidden border border-border">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-chart-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    {progress === 100 && points.length > 0 && (
                      <div className="mt-3 text-center">
                        <span className="text-sm font-medium flex items-center justify-center gap-2 text-primary">
                          <CheckCircle2 size={16} />
                          All notes reviewed! Great job!
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-8 bg-muted/50 p-1 rounded-xl border border-border w-fit animate-in fade-in slide-in-from-bottom duration-500 delay-100">
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "notes"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <FileText size={16} />
            Notes
            {totalDisplayPoints > 0 && (
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "notes"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
                }`}>
                {totalDisplayPoints}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("blog")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "blog"
              ? "bg-card text-foreground shadow-sm border border-border"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <BookOpen size={16} />
            Blog
            {isBlogStreaming && (
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            )}
            {!isBlogStreaming && displayBlogText && (
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeTab === "blog"
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground"
                }`}>
                ✓
              </span>
            )}
          </button>
        </div>

        {/* ── Notes Tab ──────────────────────────────────────────────────── */}
        {activeTab === "notes" && (
          <>
            {/* Insights Grid */}
            {totalDisplayPoints > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
                {/* Left Column - Action Items + Insights */}
                <div className="space-y-8">
                  {groupedPoints.action.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-left duration-500 delay-100">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Target size={24} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-foreground">
                            Action Items
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Things to do
                          </p>
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
                            onToggle={
                              "id" in point && !isExtracting
                                ? () =>
                                  togglePoint(
                                    (point as VideoPoint).id,
                                    (point as VideoPoint).isCompleted,
                                  )
                                : undefined
                            }
                            onPreview={
                              "id" in point && !isExtracting
                                ? () => setPreviewPoint(point as VideoPoint)
                                : undefined
                            }
                            isUpdating={
                              "id" in point
                                ? updatingPoint === (point as VideoPoint).id
                                : false
                            }
                            colorClass="primary"
                            videoId={video.youtubeId}
                            isStreaming={isExtracting}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {groupedPoints.insight.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-left duration-500 delay-300">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-chart-3/10 border border-chart-3/30 flex items-center justify-center">
                          <Lightbulb size={24} className="text-chart-3" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-foreground">
                            Insights
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Aha moments
                          </p>
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
                            onToggle={
                              "id" in point && !isExtracting
                                ? () =>
                                  togglePoint(
                                    (point as VideoPoint).id,
                                    (point as VideoPoint).isCompleted,
                                  )
                                : undefined
                            }
                            onPreview={
                              "id" in point && !isExtracting
                                ? () => setPreviewPoint(point as VideoPoint)
                                : undefined
                            }
                            isUpdating={
                              "id" in point
                                ? updatingPoint === (point as VideoPoint).id
                                : false
                            }
                            colorClass="chart-3"
                            videoId={video.youtubeId}
                            isStreaming={isExtracting}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Right Column - Key Takeaways */}
                <div className="space-y-8">
                  {groupedPoints.remember.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-right duration-500 delay-200">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-12 h-12 rounded-2xl bg-chart-2/10 border border-chart-2/30 flex items-center justify-center">
                          <Brain size={24} className="text-chart-2" />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-xl font-bold text-foreground">
                            Key Takeaways
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Remember these
                          </p>
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
                            onToggle={
                              "id" in point && !isExtracting
                                ? () =>
                                  togglePoint(
                                    (point as VideoPoint).id,
                                    (point as VideoPoint).isCompleted,
                                  )
                                : undefined
                            }
                            onPreview={
                              "id" in point && !isExtracting
                                ? () => setPreviewPoint(point as VideoPoint)
                                : undefined
                            }
                            isUpdating={
                              "id" in point
                                ? updatingPoint === (point as VideoPoint).id
                                : false
                            }
                            colorClass="chart-2"
                            videoId={video.youtubeId}
                            isStreaming={isExtracting}
                          />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            )}

            {/* Empty state while streaming with no points yet */}
            {totalDisplayPoints === 0 && showStreamingUI && (
              <div className="text-center py-16">
                <Loader2
                  size={48}
                  className="animate-spin text-primary mx-auto mb-4"
                />
                <p className="text-muted-foreground text-lg">
                  Watching the video and extracting insights...
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  This may take a moment for longer videos
                </p>
              </div>
            )}

            {/* Empty state for saved video with no points */}
            {totalDisplayPoints === 0 && !isExtracting && !loading && (
              <div className="text-center py-16 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center mx-auto mb-4">
                  <Zap size={32} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">
                  No notes found for this video.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Blog Tab ───────────────────────────────────────────────────── */}
        {activeTab === "blog" && (
          <div className="animate-in fade-in duration-300">
            {/* Blog streaming / content */}
            {displayBlogText ? (
              <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                {/* Blog header bar */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
                      <BookOpen size={20} className="text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground text-lg">
                        In-Depth Article
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {isBlogStreaming
                          ? "AI is writing the article..."
                          : blogSaved
                            ? "Generated by AI • Saved"
                            : "Generated by AI"}
                      </p>
                    </div>
                  </div>
                  {isBlogStreaming && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/30">
                      <Loader2 size={14} className="animate-spin" />
                      Writing...
                    </div>
                  )}
                </div>
                {/* Blog body */}
                <div className="px-6 sm:px-10 py-8 blog-content">
                  {renderMarkdown(displayBlogText)}
                  {isBlogStreaming && (
                    <span className="inline-block w-2 h-5 bg-primary rounded-sm animate-pulse ml-0.5 align-text-bottom"></span>
                  )}
                </div>
              </div>
            ) : (
              /* Blog empty / loading state */
              <div className="text-center py-16 animate-in fade-in duration-500">
                {isBlogStreaming ? (
                  <>
                    <Loader2
                      size={48}
                      className="animate-spin text-primary mx-auto mb-4"
                    />
                    <p className="text-muted-foreground text-lg">
                      AI is writing an in-depth article...
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      This may take a moment
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-2xl bg-card border-2 border-dashed border-border flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={32} className="text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-lg">
                      No blog article has been generated yet.
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Blog articles are generated alongside notes when you extract a video.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Video Preview Modal */}
      {previewPoint && video && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setPreviewPoint(null)}
          ></div>
          <div className="relative bg-card border border-border rounded-3xl overflow-hidden w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Video size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Video Clip</h3>
                  {previewPoint.timestamp !== null && (
                    <p className="text-sm text-muted-foreground">
                      Starting at {formatTimestamp(previewPoint.timestamp)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreviewPoint(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* YouTube Embed */}
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}${previewPoint.timestamp ? `?start=${previewPoint.timestamp}&autoplay=1` : "?autoplay=1"}`}
                title="Video preview"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Point Content */}
            <div className="p-5 border-t border-border bg-muted/30">
              <p className="text-foreground">{previewPoint.content}</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary border border-primary/30">
                  {previewPoint.category}
                </span>
                {previewPoint.timestamp !== null && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground border border-border flex items-center gap-1">
                    <Clock size={12} />
                    {formatTimestamp(previewPoint.timestamp)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => { setShowDeleteModal(false); setDeleteError(""); }}
          ></div>
          <div className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => { setShowDeleteModal(false); setDeleteError(""); }}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/30 mb-4">
                <AlertTriangle size={28} className="text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Delete Video?</h2>
              <p className="text-muted-foreground text-sm">
                This will permanently delete this video and all its extracted notes. This action cannot be undone.
              </p>
            </div>

            {deleteError && (
              <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in duration-200 flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteError(""); }}
                className="flex-1 px-6 py-3.5 border border-border rounded-xl text-foreground font-medium hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-destructive text-destructive-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PointCard Component ─────────────────────────────────────────────────────

interface PointCardProps {
  point: ActionablePoint | VideoPoint;
  onToggle?: () => void;
  onPreview?: () => void;
  isUpdating: boolean;
  colorClass: string;
  videoId: string;
  isStreaming: boolean;
}

const borderColorMap: Record<string, string> = {
  primary: "border-l-primary",
  "chart-2": "border-l-chart-2",
  "chart-3": "border-l-chart-3",
};

const badgeColorMap: Record<string, string> = {
  primary: "bg-primary/10 text-primary border-primary/30",
  "chart-2": "bg-chart-2/10 text-chart-2 border-chart-2/30",
  "chart-3": "bg-chart-3/10 text-chart-3 border-chart-3/30",
};

function PointCard({
  point,
  onToggle,
  onPreview,
  isUpdating,
  colorClass,
  videoId,
  isStreaming,
}: PointCardProps) {
  const isCompleted = "isCompleted" in point ? point.isCompleted : false;

  return (
    <div
      className={`bg-card border border-border rounded-xl p-5 transition-all duration-300 group hover:shadow-md hover:border-primary/30 border-l-4 ${borderColorMap[colorClass]} ${isCompleted ? "opacity-60" : ""
        }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox or circle indicator */}
        <div className="pt-0.5 flex-shrink-0">
          {isStreaming ? (
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30 mt-1"></div>
          ) : onToggle ? (
            <div className="cursor-pointer" onClick={onToggle}>
              {isUpdating ? (
                <Loader2 size={24} className="animate-spin text-primary" />
              ) : (
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isCompleted
                    ? "bg-primary border-primary"
                    : "border-border group-hover:border-primary"
                    }`}
                >
                  {isCompleted && (
                    <CheckCircle2
                      size={14}
                      className="text-primary-foreground"
                    />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-muted-foreground/30 mt-1"></div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-base leading-relaxed text-foreground ${isCompleted ? "line-through text-muted-foreground" : ""
              }`}
          >
            {point.content}
          </p>

          {/* Timestamp & badge */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {point.timestamp && videoId && !isStreaming && onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-all"
              >
                <Play size={12} fill="currentColor" />
                Watch at {formatTimestamp(point.timestamp)}
              </button>
            )}
            {point.timestamp && (isStreaming || !onPreview) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary border border-primary/30">
                <Play size={12} fill="currentColor" />
                {formatTimestamp(point.timestamp)}
              </span>
            )}
            <span
              className={`hidden sm:inline-flex px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full border ${badgeColorMap[colorClass]}`}
            >
              {point.category}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
