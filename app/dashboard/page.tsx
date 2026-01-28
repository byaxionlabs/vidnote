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
  Zap,
  Film,
  User,
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
    <div className="min-h-screen relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-soft)] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Youtube size={22} className="text-[var(--bg-void)]" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight font-display">VidNote</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <User size={16} className="text-[var(--text-muted)]" />
                <span className="text-sm text-[var(--text-secondary)]">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="btn-icon hover:!border-[var(--danger)]/50 hover:!text-[var(--danger)]"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div className="animate-fadeIn">
            <div className="flex items-center gap-2 text-[var(--accent-gold)] text-sm font-semibold mb-2">
              <Film size={16} />
              <span>YOUR LIBRARY</span>
            </div>
            <h1 className="text-4xl font-bold font-display mb-2">Video Insights</h1>
            <p className="text-[var(--text-secondary)]">
              {videos.length} {videos.length === 1 ? "video" : "videos"} processed
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
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
                <div className="p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4"></div>
                  <div className="skeleton h-4 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-24 animate-fadeIn">
            <div className="relative inline-block mb-8">
              <div className="w-28 h-28 rounded-3xl bg-[var(--bg-surface)] border border-[var(--glass-border)] flex items-center justify-center">
                <PlayCircle size={48} className="text-[var(--text-muted)]" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-cyan)] flex items-center justify-center animate-float">
                <Sparkles size={24} className="text-[var(--bg-void)]" />
              </div>
            </div>
            <h2 className="text-3xl font-bold font-display mb-3">No videos yet</h2>
            <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto text-lg">
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
                      className="video-thumbnail"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-void)]/90 via-[var(--bg-void)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                          <CheckCircle2 size={18} className="text-[var(--success)]" />
                          View Insights
                        </span>
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)] flex items-center justify-center">
                          <PlayCircle size={20} className="text-[var(--bg-void)] ml-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold font-display line-clamp-2 mb-3 group-hover:text-[var(--accent-gold)] transition-colors text-lg">
                      {video.title || "Untitled Video"}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <Clock size={14} />
                      {new Date(video.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </Link>
                <div className="px-5 pb-5 flex gap-2">
                  <a
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-secondary py-2.5 flex items-center justify-center gap-2 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    Watch on YouTube
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(video.id);
                    }}
                    disabled={deletingId === video.id}
                    className="btn-icon !w-10 !h-10 hover:!border-[var(--danger)]/50 hover:!text-[var(--danger)] hover:!bg-[var(--danger)]/10"
                  >
                    {deletingId === video.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
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
            className="absolute inset-0 bg-[var(--bg-void)]/80 backdrop-blur-md"
            onClick={() => !processing && setShowModal(false)}
          ></div>
          <div className="relative glass-card p-8 w-full max-w-lg animate-fadeInScale">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-gold)] via-[var(--accent-cyan)] to-[var(--accent-gold)] rounded-t-[var(--radius-lg)]"></div>
            
            <button
              onClick={() => !processing && setShowModal(false)}
              className="absolute top-5 right-5 btn-icon !w-9 !h-9"
              disabled={processing}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-cyan)] flex items-center justify-center shadow-lg animate-glow">
                <Sparkles size={26} className="text-[var(--bg-void)]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-display">Add New Video</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Paste a YouTube URL to extract insights
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
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
                <div className="mb-5 p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm animate-fadeIn">
                  {error}
                </div>
              )}

              {processing && (
                <div className="mb-5 p-5 rounded-xl bg-[var(--accent-gold)]/5 border border-[var(--accent-gold)]/20 animate-fadeIn">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <Loader2 size={24} className="animate-spin text-[var(--accent-gold)]" />
                    </div>
                    <span className="font-semibold text-[var(--accent-gold)]">Processing video...</span>
                  </div>
                  <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></div>
                      <p>Analyzing video with Gemini AI</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-cyan)] animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <p>Extracting actionable insights</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--insight)] animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                      <p>Organizing key takeaways</p>
                    </div>
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
                    Extracting Insights...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
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
