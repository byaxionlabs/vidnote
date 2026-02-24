export interface VideoItem {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  createdAt: string;
}

export interface VideoPoint {
  id: string;
  content: string;
  category: string;
  timestamp: number | null;
  isCompleted: boolean;
  order: number;
}

export interface DashboardResponse {
  videos: VideoItem[];
}

export interface VideoResponse {
  video: VideoItem;
  points: VideoPoint[];
  blogContent?: string | null;
}

export function dashboardQueryKey(userId: string) {
  return ["dashboard", userId] as const;
}

export function videoQueryKey(videoId: string) {
  return ["video", videoId] as const;
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch("/api/videos");
  if (!res.ok) {
    throw new Error("Failed to load videos");
  }
  return res.json();
}

export async function fetchVideoById(videoId: string): Promise<VideoResponse> {
  const res = await fetch(`/api/videos/${videoId}`);
  if (!res.ok) {
    throw new Error("Video not found");
  }
  return res.json();
}
