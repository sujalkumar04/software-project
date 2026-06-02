export const BASE_URL = "http://localhost:8000";

export interface VideoMeta {
  video_id: string;
  platform: string;
  url: string;
  title: string;
  creator: string;
  views: number;
  likes: number;
  comments: number;
  engagement_rate: number;
  upload_date: string;
  duration_seconds: number;
  hashtags: string[];
  thumbnail_url: string;
  follower_count: number | null;
}

export interface Source {
  video_id: string;
  chunk_index: number;
  title: string;
  creator: string;
  text_snippet: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface IngestResponse {
  status: string;
  video_a: VideoMeta;
  video_b: VideoMeta;
}

export interface VideosResponse {
  A: VideoMeta | null;
  B: VideoMeta | null;
}

export async function ingestVideos(youtubeUrl: string, instagramUrl: string): Promise<IngestResponse> {
  const res = await fetch(BASE_URL + "/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ youtube_url: youtubeUrl, instagram_url: instagramUrl })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Ingest failed");
  }
  return res.json();
}

export async function sendMessage(message: string): Promise<ChatResponse> {
  const res = await fetch(BASE_URL + "/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Chat failed");
  }
  return res.json();
}

export async function getVideos(): Promise<VideosResponse> {
  const res = await fetch(BASE_URL + "/videos");
  if (!res.ok) throw new Error("Failed to fetch videos");
  return res.json();
}
