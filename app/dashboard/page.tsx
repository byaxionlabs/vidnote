"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Youtube,
  Plus,
  Loader2,
  Trash2,
  ExternalLink,
  LogOut,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  PlayCircle,
} from "lucide-react";

interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchVideos();
    }
  }, [session]);

  const fetchVideos = async () => {
    try {
      const res = await fetch("/api/videos");
      const data = await res.json();
      if (data.videos) {
        setVideos(data.videos);
      }
    } catch (err) {
      console.error("Error fetching videos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process video");
      }

      setShowModal(false);
      setUrl("");
      router.push(`/video/${data.video.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video and all its notes?")) {
      return;
    }

    setDeletingId(id);
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
      setVideos(videos.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Error deleting video:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-glass-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                <Youtube size={22} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">VidNote</span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted hidden sm:block">
                {session.user.email}
              </span>
              <button
                onClick={() => signOut()}
                className="btn-secondary flex items-center gap-2 py-2 px-4"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your Videos</h1>
            <p className="text-muted">
              {videos.length} {videos.length === 1 ? "video" : "videos"} processed
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Video
          </button>
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card overflow-hidden">
                <div className="skeleton aspect-video"></div>
                <div className="p-4 space-y-3">
                  <div className="skeleton h-5 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-card mx-auto mb-6 flex items-center justify-center">
              <PlayCircle size={40} className="text-muted" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No videos yet</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              Add your first YouTube video to start extracting actionable insights
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Add Your First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div
                key={video.id}
                className="video-card group animate-fadeIn"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Link href={`/video/${video.id}`} className="block">
                  <div className="relative overflow-hidden">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title || "Video thumbnail"}
                      width={480}
                      height={270}
                      className="video-thumbnail transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-white">
                          <CheckCircle2 size={16} />
                          View Notes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {video.title || "Untitled Video"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <Clock size={14} />
                      {new Date(video.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4 flex gap-2">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-secondary py-2 flex items-center justify-center gap-2 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    Watch
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(video.id);
                    }}
                    disabled={deletingId === video.id}
                    className="btn-secondary py-2 px-3 text-red-400 hover:text-red-300 hover:border-red-400/50"
                  >
                    {deletingId === video.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Video Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !processing && setShowModal(false)}
          ></div>
          <div className="relative glass-card p-6 w-full max-w-lg animate-fadeIn">
            <button
              onClick={() => !processing && setShowModal(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
              disabled={processing}
            >
              <X size={24} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                <Sparkles size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Add New Video</h2>
                <p className="text-sm text-muted">
                  Paste a YouTube URL to extract insights
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input-glass"
                  required
                  disabled={processing}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {processing && (
                <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 size={20} className="animate-spin text-primary" />
                    <span className="font-medium">Processing video...</span>
                  </div>
                  <div className="text-sm text-muted space-y-1">
                    <p>• Fetching video transcript</p>
                    <p>• Analyzing content with AI</p>
                    <p>• Extracting actionable points</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Extract Insights
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
