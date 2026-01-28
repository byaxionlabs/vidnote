"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Youtube,
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
} from "lucide-react";

interface ActionablePoint {
  id: string;
  content: string;
  category: string;
  isCompleted: boolean;
  order: number;
}

interface Video {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  createdAt: string;
}

export default function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [points, setPoints] = useState<ActionablePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingPoint, setUpdatingPoint] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session && id) {
      fetchVideo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  const fetchVideo = async () => {
    try {
      const res = await fetch(`/api/videos/${id}`);
      if (!res.ok) {
        throw new Error("Video not found");
      }
      const data = await res.json();
      setVideo(data.video);
      setPoints(data.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video");
    } finally {
      setLoading(false);
    }
  };

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
          p.id === pointId ? { ...p, isCompleted: !isCompleted } : p
        )
      );
    } catch (err) {
      console.error("Error updating point:", err);
    } finally {
      setUpdatingPoint(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this video and all its notes?")) {
      return;
    }

    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch (err) {
      console.error("Error deleting video:", err);
    }
  };

  const groupedPoints = {
    action: points.filter((p) => p.category === "action"),
    remember: points.filter((p) => p.category === "remember"),
    insight: points.filter((p) => p.category === "insight"),
  };

  const completedCount = points.filter((p) => p.isCompleted).length;
  const progress = points.length > 0 ? (completedCount / points.length) * 100 : 0;

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen relative z-10">
        <header className="sticky top-0 z-50 glass border-b border-[var(--glass-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-18 py-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-soft)] flex items-center justify-center shadow-lg">
                  <Youtube size={22} className="text-[var(--bg-void)]" />
                </div>
                <span className="text-xl font-bold tracking-tight font-display">VidNote</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="skeleton h-8 w-48 mb-8"></div>
          <div className="skeleton aspect-video rounded-2xl mb-10"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-10">
        <div className="text-center animate-fadeIn">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-surface)] border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-6">
            <Youtube size={40} className="text-[var(--text-muted)]" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-3">Video Not Found</h1>
          <p className="text-[var(--text-secondary)] mb-8 max-w-md">{error || "This video doesn't exist or you don't have access to it."}</p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
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
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-soft)] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Youtube size={22} className="text-[var(--bg-void)]" />
              </div>
              <span className="text-xl font-bold tracking-tight font-display">VidNote</span>
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-2.5 px-4 flex items-center gap-2"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">Watch Video</span>
              </a>
              <button
                onClick={handleDelete}
                className="btn-icon hover:!border-[var(--danger)]/50 hover:!text-[var(--danger)] hover:!bg-[var(--danger)]/10"
                title="Delete Video"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--accent-gold)] transition-colors mb-8 group animate-fadeIn"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>

        {/* Video Info Card */}
        <div className="glass-card overflow-hidden mb-10 animate-fadeIn" style={{ animationDelay: "0.1s" }}>
          {/* Gradient top border */}
          <div className="h-1 bg-gradient-to-r from-[var(--accent-gold)] via-[var(--accent-cyan)] to-[var(--accent-gold)]"></div>
          
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-96 flex-shrink-0 relative overflow-hidden">
              <Image
                src={video.thumbnailUrl}
                alt={video.title || "Video thumbnail"}
                width={384}
                height={216}
                className="w-full h-full object-cover"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-void)]/20 to-transparent flex items-center justify-center">
                <a
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-16 h-16 rounded-full bg-[var(--accent-gold)] flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6 text-[var(--bg-void)] ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="flex-1 p-6 lg:p-8">
              <h1 className="text-2xl lg:text-3xl font-bold font-display mb-4 line-clamp-2 leading-tight">{video.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)] mb-6">
                <span className="flex items-center gap-2">
                  <Clock size={15} />
                  Added {new Date(video.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles size={15} className="text-[var(--accent-gold)]" />
                  <span className="text-[var(--accent-gold)]">{points.length} insights</span>
                </span>
              </div>

              {/* Progress Section */}
              <div className="bg-[var(--bg-deep)] rounded-xl p-5 border border-[var(--glass-border)]">
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[var(--accent-gold)]" />
                    <span className="font-medium">Progress</span>
                  </div>
                  <span className="text-[var(--accent-gold)] font-bold">
                    {completedCount} / {points.length}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                {progress === 100 && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-[var(--success)] font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} />
                      All insights reviewed!
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Points */}
        <div className="space-y-10">
          {/* Action Items */}
          {groupedPoints.action.length > 0 && (
            <section className="animate-fadeIn" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[var(--success-glow)] border border-[var(--success)]/30 flex items-center justify-center">
                  <Target size={24} className="text-[var(--success)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">Action Items</h2>
                  <p className="text-sm text-[var(--text-muted)]">Things to do after watching</p>
                </div>
                <div className="ml-auto">
                  <span className="badge badge-action">{groupedPoints.action.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {groupedPoints.action.map((point, index) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    onToggle={() => togglePoint(point.id, point.isCompleted)}
                    isUpdating={updatingPoint === point.id}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Key Takeaways */}
          {groupedPoints.remember.length > 0 && (
            <section className="animate-fadeIn" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[var(--warning-glow)] border border-[var(--warning)]/30 flex items-center justify-center">
                  <Brain size={24} className="text-[var(--warning)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">Key Takeaways</h2>
                  <p className="text-sm text-[var(--text-muted)]">Important facts to remember</p>
                </div>
                <div className="ml-auto">
                  <span className="badge badge-remember">{groupedPoints.remember.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {groupedPoints.remember.map((point, index) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    onToggle={() => togglePoint(point.id, point.isCompleted)}
                    isUpdating={updatingPoint === point.id}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Insights */}
          {groupedPoints.insight.length > 0 && (
            <section className="animate-fadeIn" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[var(--insight-glow)] border border-[var(--insight)]/30 flex items-center justify-center">
                  <Lightbulb size={24} className="text-[var(--insight)]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display">Insights</h2>
                  <p className="text-sm text-[var(--text-muted)]">Deeper understanding and aha moments</p>
                </div>
                <div className="ml-auto">
                  <span className="badge badge-insight">{groupedPoints.insight.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {groupedPoints.insight.map((point, index) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    onToggle={() => togglePoint(point.id, point.isCompleted)}
                    isUpdating={updatingPoint === point.id}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {points.length === 0 && (
            <div className="text-center py-16 animate-fadeIn">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] border border-[var(--glass-border)] flex items-center justify-center mx-auto mb-4">
                <Zap size={32} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)]">No actionable points found for this video.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

interface PointCardProps {
  point: ActionablePoint;
  onToggle: () => void;
  isUpdating: boolean;
  index: number;
}

function PointCard({ point, onToggle, isUpdating, index }: PointCardProps) {
  const categoryColors = {
    action: {
      border: "var(--success)",
      bg: "var(--success-glow)",
    },
    remember: {
      border: "var(--warning)",
      bg: "var(--warning-glow)",
    },
    insight: {
      border: "var(--insight)",
      bg: "var(--insight-glow)",
    },
  };

  const colors = categoryColors[point.category as keyof typeof categoryColors] || categoryColors.action;

  return (
    <div
      className={`glass-card p-5 flex items-start gap-4 transition-all duration-300 cursor-pointer group ${
        point.isCompleted ? "opacity-60" : ""
      }`}
      style={{
        animationDelay: `${index * 0.05}s`,
        borderLeftWidth: "3px",
        borderLeftColor: point.isCompleted ? "var(--glass-border)" : colors.border,
      }}
      onClick={onToggle}
    >
      <div className="pt-0.5 flex-shrink-0">
        {isUpdating ? (
          <Loader2 size={26} className="animate-spin text-[var(--accent-gold)]" />
        ) : (
          <input
            type="checkbox"
            checked={point.isCompleted}
            onChange={() => {}}
            className="checkbox-custom"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-base leading-relaxed ${
            point.isCompleted ? "line-through text-[var(--text-muted)]" : ""
          }`}
        >
          {point.content}
        </p>
      </div>
      <span className={getCategoryBadgeClass(point.category)}>
        {point.category}
      </span>
    </div>
  );
}

function getCategoryBadgeClass(category: string) {
  switch (category) {
    case "action":
      return "badge badge-action";
    case "remember":
      return "badge badge-remember";
    case "insight":
      return "badge badge-insight";
    default:
      return "badge";
  }
}
