import { useState, useEffect } from "react";
import { ingestVideos, getVideos, VideoMeta } from "./api/client";
import VideoCard from "./components/VideoCard";
import ChatPanel from "./components/ChatPanel";

export default function App() {
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");
  const [videoA, setVideoA] = useState<VideoMeta | null>(null);
  const [videoB, setVideoB] = useState<VideoMeta | null>(null);
  const [ingesting, setIngesting] = useState<boolean>(false);
  const [ingested, setIngested] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVideos()
      .then(res => {
        if (res.A && res.B) {
          setVideoA(res.A);
          setVideoB(res.B);
          setIngested(true);
        }
      })
      .catch(() => {});
  }, []);

  async function handleIngest() {
    if (!youtubeUrl.trim() || !instagramUrl.trim()) {
      setError("Both URLs are required");
      return;
    }
    setIngesting(true);
    setError(null);
    try {
      const res = await ingestVideos(youtubeUrl, instagramUrl);
      setVideoA(res.video_a);
      setVideoB(res.video_b);
      setIngested(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIngesting(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f1f5f9",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* TOP BAR */}
      <div style={{
        background: "#1e293b",
        color: "white",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center"
      }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>🎯 Creator RAG Analyst</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8" }}>
          LangChain · Groq llama3-70b · ChromaDB · BGE
        </span>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}>
        
        {/* INGEST CARD */}
        <div style={{
          background: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
        }}>
          <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 600 }}>Analyze Two Videos</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={youtubeUrl}
              onChange={e => setYoutubeUrl(e.target.value)}
              placeholder="YouTube URL"
              disabled={ingesting}
              style={{
                flex: 1,
                minWidth: 220,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                outline: "none"
              }}
            />
            <input
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="Instagram Reel URL"
              disabled={ingesting}
              style={{
                flex: 1,
                minWidth: 220,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              onClick={handleIngest}
              disabled={ingesting}
              style={{
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {ingesting ? "Analyzing..." : "Analyze Videos"}
            </button>
          </div>
          {error && <div style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{error}</div>}
          {ingesting && (
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 8 }}>
              ⏳ Fetching metadata, transcripts, and building vector index. This may take 30–60 seconds...
            </div>
          )}
        </div>

        {/* VIDEO CARDS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <VideoCard label="A" video={videoA} loading={ingesting} />
          <VideoCard label="B" video={videoB} loading={ingesting} />
        </div>

        {/* CHAT SECTION */}
        <div style={{
          background: "white",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden"
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>💬 Ask About These Videos</span>
            {ingested ? (
              <span style={{
                marginLeft: "auto",
                fontSize: 11,
                color: "#16a34a",
                background: "#f0fdf4",
                padding: "3px 10px",
                borderRadius: 999
              }}>
                ● Ready
              </span>
            ) : (
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#6b7280" }}>
                Ingest videos first
              </span>
            )}
          </div>
          <ChatPanel disabled={!ingested} />
        </div>

      </div>
    </div>
  );
}
