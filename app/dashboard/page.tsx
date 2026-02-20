"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
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
  LayoutGrid,
  User,
  Key,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiKeySettings } from "@/components/api-key-settings";
import { hasStoredApiKey } from "@/lib/api-key";

interface VideoItem {
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
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchVideos();
      setHasApiKey(hasStoredApiKey());
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

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      // Validate + create the video record (without points)
      const res = await fetch("/api/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create video");
        setSubmitting(false);
        return;
      }

      // Navigate to the video page with extract flag — streaming happens there
      setShowModal(false);
      router.push(`/video/${data.video.id}?extract=true`);
      setUrl("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video and all its notes?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }

      setVideos(videos.filter((v) => v.id !== id));
    } catch (err) {
      console.error("Error deleting video:", err);
      alert(err instanceof Error ? err.message : "Failed to delete video. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 w-[800px] h-[400px] bg-primary/3 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border hidden lg:flex flex-col z-40">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3">

            <span className="text-3xl font-bold text-foreground font-serif italic">Theo Notes</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary font-medium"
            >
              <LayoutGrid size={20} />
              <span>My Notes</span>
            </Link>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              <div className="relative">
                <Key size={20} />
                {hasApiKey && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-chart-2 rounded-full border-2 border-card"></span>
                )}
              </div>
              <span>API Key</span>
            </button>
          </div>

          {/* Channel Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Videos from</p>
            <p className="text-sm font-medium text-primary">@t3dotgg</p>
            <p className="text-xs text-muted-foreground">Theo&apos;s Channel Only</p>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0 ">
                <p className="text-sm font-medium text-foreground truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-all text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <span className="text-lg font-bold text-primary-foreground">T</span>
            </div>
            <span className="text-xl font-bold text-foreground font-serif">Theo-Notes</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all relative"
              title="API Key Settings"
            >
              <Key size={18} />
              {hasApiKey && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-chart-2 rounded-full border-2 border-card"></span>
              )}
            </button>
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 relative z-10">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div className="animate-in fade-in slide-in-from-left duration-500">
              <h1 className="text-4xl lg:text-5xl mb-3 text-foreground">
                Your <span className="text-primary italic">Theo Notes</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                {videos.length} {videos.length === 1 ? "video" : "videos"} with extracted insights
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all animate-in fade-in slide-in-from-right duration-500"
            >
              <Plus size={20} />
              Add Video
            </button>
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-muted animate-pulse"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded"></div>
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-24 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative inline-block mb-8">
                <div className="w-32 h-32 rounded-3xl bg-card border-2 border-dashed border-border flex items-center justify-center">
                  <PlayCircle size={48} className="text-muted-foreground" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <Sparkles size={26} className="text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-3xl mb-4 text-foreground">No notes yet</h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Add your first video from <span className="text-primary font-medium">@t3dotgg</span> to start extracting insights
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Plus size={20} />
                Add Your First Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-xl hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link href={`/video/${video.id}`} className="block">
                    <div className="relative overflow-hidden">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        width={480}
                        height={270}
                        className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg shadow-md">
                          <CheckCircle2 size={16} />
                          View Notes
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold line-clamp-2 mb-3 group-hover:text-primary transition-colors text-lg text-foreground leading-snug">
                        {video.title || "Untitled Video"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                      className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm border border-border rounded-xl text-foreground hover:bg-accent hover:border-primary/50 transition-all"
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
                      className="w-11 h-11 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-all"
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
        </div>
      </main>

      {/* Add Video Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
                <Sparkles size={28} className="text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Add Theo Video</h2>
              <p className="text-muted-foreground text-sm">
                Paste a video URL from <span className="text-primary">@t3dotgg</span>
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-medium mb-2 text-foreground">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Only videos from Theo&apos;s channel are supported
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-in fade-in duration-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    Extract Notes
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* API Key Settings Modal */}
      <ApiKeySettings
        userId={session.user.id}
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setHasApiKey(hasStoredApiKey());
        }}
      />
    </div>
  );
}
