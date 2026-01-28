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
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass border-b border-glass-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-purple flex items-center justify-center">
                  <Youtube size={22} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">VidNote</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="skeleton h-8 w-48 mb-6"></div>
          <div className="skeleton aspect-video rounded-2xl mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Video Not Found</h1>
          <p className="text-muted mb-6">{error || "This video doesn't exist or you don't have access to it."}</p>
          <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>
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
            <div className="flex items-center gap-2">
              <a
                href={video.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary py-2 px-4 flex items-center gap-2"
              >
                <ExternalLink size={16} />
                <span className="hidden sm:inline">Watch Video</span>
              </a>
              <button
                onClick={handleDelete}
                className="btn-secondary py-2 px-3 text-red-400 hover:text-red-300 hover:border-red-400/50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* Video Info Card */}
        <div className="glass-card overflow-hidden mb-8 animate-fadeIn">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-80 flex-shrink-0">
              <Image
                src={video.thumbnailUrl}
                alt={video.title || "Video thumbnail"}
                width={320}
                height={180}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-6">
              <h1 className="text-2xl font-bold mb-3 line-clamp-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted mb-4">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Added {new Date(video.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles size={14} />
                  {points.length} insights extracted
                </span>
              </div>

              {/* Progress */}
              <div className="mt-auto">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted">Progress</span>
                  <span className="font-medium">
                    {completedCount} / {points.length} completed
                  </span>
                </div>
                <div className="h-2 bg-card rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-green to-secondary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actionable Points */}
        <div className="space-y-8">
          {/* Action Items */}
          {groupedPoints.action.length > 0 && (
            <section className="animate-fadeIn" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-green/10 border border-accent-green/30 flex items-center justify-center">
                  <Target size={20} className="text-accent-green" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Action Items</h2>
                  <p className="text-sm text-muted">Things to do after watching</p>
                </div>
              </div>
              <div className="space-y-3">
                {groupedPoints.action.map((point) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    onToggle={() => togglePoint(point.id, point.isCompleted)}
                    isUpdating={updatingPoint === point.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Key Takeaways */}
          {groupedPoints.remember.length > 0 && (
            <section className="animate-fadeIn" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-yellow/10 border border-accent-yellow/30 flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-accent-yellow" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Key Takeaways</h2>
                  <p className="text-sm text-muted">Important facts to remember</p>
                </div>
              </div>
              <div className="space-y-3">
                {groupedPoints.remember.map((point) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    onToggle={() => togglePoint(point.id, point.isCompleted)}
                    isUpdating={updatingPoint === point.id}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Insights */}
          {groupedPoints.insight.length > 0 && (
            <section className="animate-fadeIn" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-accent-purple/10 border border-accent-purple/30 flex items-center justify-center">
                  <Lightbulb size={20} className="text-accent-purple" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Insights</h2>
                  <p className="text-sm text-muted">Deeper understanding and aha moments</p>
                </div>
              </div>
              <div className="space-y-3">
                {groupedPoints.insight.map((point) => (
                  <PointCard
                    key={point.id}
                    point={point}
                    onToggle={() => togglePoint(point.id, point.isCompleted)}
                    isUpdating={updatingPoint === point.id}
                  />
                ))}
              </div>
            </section>
          )}

          {points.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted">No actionable points found for this video.</p>
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
}

function PointCard({ point, onToggle, isUpdating }: PointCardProps) {
  return (
    <div
      className={`glass-card p-4 flex items-start gap-4 transition-all cursor-pointer hover:border-primary/50 ${
        point.isCompleted ? "opacity-60" : ""
      }`}
      onClick={onToggle}
    >
      <div className="pt-0.5">
        {isUpdating ? (
          <Loader2 size={24} className="animate-spin text-primary" />
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
            point.isCompleted ? "line-through text-muted" : ""
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
