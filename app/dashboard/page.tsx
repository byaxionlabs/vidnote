"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  AlertTriangle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiKeySettings } from "@/components/api-key-settings";
import { hasStoredApiKey, loadApiKey, isValidApiKeyFormat } from "@/lib/api-key";
import { dashboardQueryKey, fetchDashboard } from "@/lib/queries";
import { prefetchVideo } from "@/lib/prefetch";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const userId = session?.user.id;
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: dashboardQueryKey(userId ?? ""),
    queryFn: fetchDashboard,
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (dashboardData?.videos) {
      setVideos(dashboardData.videos);
    }
  }, [dashboardData]);

  useEffect(() => {
    if (session) setHasApiKey(hasStoredApiKey());
  }, [session]);

  // Prefetch video data on hover so navigation feels instant
  const handlePrefetchVideo = useCallback(
    (videoId: string) => prefetchVideo(queryClient, videoId),
    [queryClient],
  );

  const [submitting, setSubmitting] = useState(false);

  // Check API key before showing the modal
  const handleAddVideoClick = () => {
    if (!hasStoredApiKey()) {
      toast.error("API key required", {
        description: "Please add your Gemini API key before extracting notes.",
        action: {
          label: "Add Key",
          onClick: () => setShowApiKeyModal(true),
        },
      });
      return;
    }
    setShowModal(true);
    setError("");
    setUrl("");
    setCustomPrompt("");
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      // Step 1: Load and validate the API key format
      const apiKey = await loadApiKey(session!.user.id);
      if (!apiKey) {
        toast.error("API key not found", {
          description: "Please add your Gemini API key in settings.",
          action: {
            label: "Add Key",
            onClick: () => { setShowModal(false); setShowApiKeyModal(true); },
          },
        });
        setSubmitting(false);
        return;
      }

      if (!isValidApiKeyFormat(apiKey)) {
        toast.error("Invalid API key format", {
          description: "Your saved key doesn't match the expected Gemini API key format. Please update it.",
          action: {
            label: "Update Key",
            onClick: () => { setShowModal(false); setShowApiKeyModal(true); },
          },
        });
        setSubmitting(false);
        return;
      }

      // Step 2: Validate the API key with Google
      const validateRes = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": apiKey,
        },
      });

      const validateData = await validateRes.json();

      if (!validateData.valid) {
        toast.error("API key validation failed", {
          description: validateData.error || "Your API key is invalid. Please check and update it.",
          action: {
            label: "Update Key",
            onClick: () => { setShowModal(false); setShowApiKeyModal(true); },
          },
        });
        setSubmitting(false);
        return;
      }

      // Step 3: Create the video record
      const res = await fetch("/api/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, customPrompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle duplicate video — offer to navigate to existing one
        if (res.status === 409 && data.existingVideoId) {
          toast.info("Video already exists", {
            description: "You've already added this video. View your existing notes.",
            action: {
              label: "View Notes",
              onClick: () => router.push(`/video/${data.existingVideoId}`),
            },
          });
          setShowModal(false);
          setSubmitting(false);
          return;
        }
        setError(data.error || "Failed to create video");
        setSubmitting(false);
        return;
      }

      // Navigate to the video page with extract flag — streaming happens there
      toast.success("Video added!", {
        description: "Extracting notes now...",
      });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: dashboardQueryKey(userId) });
      }
      setShowModal(false);
      router.push(`/video/${data.video.id}?extract=true`);
      setUrl("");
    } catch {
      toast.error("Network error", {
        description: "Something went wrong. Please check your connection and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete video");
      }

      setVideos((prevVideos) => {
        const nextVideos = prevVideos.filter((v) => v.id !== id);
        if (userId) {
          queryClient.setQueryData(dashboardQueryKey(userId), {
            videos: nextVideos,
          });
        }
        return nextVideos;
      });
      setDeleteConfirmId(null);
      toast.success("Video deleted", {
        description: "The video and all its notes have been removed.",
      });
    } catch (err) {
      console.error("Error deleting video:", err);
      setDeleteError(err instanceof Error ? err.message : "Failed to delete video. Please try again.");
      toast.error("Failed to delete", {
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
      });
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
        <div className="py-4 px-2 border-t border-border">
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
            <div>
              <h1 className="text-4xl lg:text-5xl mb-3 text-foreground">
                Your <span className="text-primary italic">Theo Notes</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                {videos.length} {videos.length === 1 ? "video" : "videos"} with extracted insights
              </p>
            </div>
            <button
              onClick={handleAddVideoClick}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all"
            >
              <Plus size={20} />
              Add Video
            </button>
          </div>

          {/* Videos Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-muted"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 bg-muted rounded"></div>
                    <div className="h-4 w-1/2 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-24">
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
                onClick={handleAddVideoClick}
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
                  className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col"
                  onMouseEnter={() => handlePrefetchVideo(video.id)}
                  onFocus={() => handlePrefetchVideo(video.id)}
                >
                  <Link href={`/video/${video.id}`} className="flex-1 flex flex-col">
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
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold line-clamp-2 mb-3 group-hover:text-primary transition-colors text-lg text-foreground leading-snug">
                        {video.title || "Untitled Video"}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
                        <Clock size={14} />
                        {new Date(video.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </Link>
                  <div className="px-5 pb-5 flex gap-2 mt-auto">
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
                        setDeleteConfirmId(video.id);
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
          <div className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-lg shadow-2xl">
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

              {/* Advanced Options Toggle */}
              <div className="mb-5">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-medium">Advanced Options</span>
                  <span className={`transform transition-transform ${showAdvanced ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border">
                    <label className="block text-sm font-medium mb-2 text-foreground">
                      Custom Prompt (Optional)
                    </label>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="E.g., Focus specifically on the system architecture and database design parts, ignore the sponsor segment."
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all resize-none min-h-[100px]"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Add specific instructions for the AI on what to focus on during extraction.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:pointer-events-none"
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
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => { setDeleteConfirmId(null); setDeleteError(""); }}
          ></div>
          <div className="relative bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <button
              onClick={() => { setDeleteConfirmId(null); setDeleteError(""); }}
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
              <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteConfirmId(null); setDeleteError(""); }}
                className="flex-1 px-6 py-3.5 border border-border rounded-xl text-foreground font-medium hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-destructive text-destructive-foreground font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:pointer-events-none"
              >
                {deletingId === deleteConfirmId ? (
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
