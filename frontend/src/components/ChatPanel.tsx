import React, { useState, useRef, useEffect } from "react";
import { sendMessage, Source } from "../api/client";

interface ChatPanelProps {
  disabled: boolean;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

const SUGGESTED = [
  "Why did Video A get more engagement than Video B?",
  "What is the engagement rate of each video?",
  "Compare the hooks in the first 5 seconds",
  "Suggest improvements for Video B based on Video A"
];

export default function ChatPanel({ disabled }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const q = text ?? input;
    if (!q.trim() || loading || disabled) return;
    
    const userMsg: Message = { id: Date.now(), role: "user", content: q };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    
    try {
      const res = await sendMessage(q);
      const botMsg: Message = { 
        id: Date.now() + 1, 
        role: "assistant", 
        content: res.answer, 
        sources: res.sources 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e: any) {
      const errMsg: Message = { 
        id: Date.now() + 1, 
        role: "assistant", 
        content: "Error: " + e.message 
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", height: "580px" }}>
      {disabled && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.85)",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0 0 16px 16px"
        }}>
          <div style={{ color: "#6b7280", fontSize: "15px" }}>
            Ingest two videos above to start chatting
          </div>
        </div>
      )}

      {/* Message List */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px"
      }}>
        {messages.map(msg => (
          msg.role === "user" ? (
            <div key={msg.id} style={{
              alignSelf: "flex-end",
              background: "#2563eb",
              color: "white",
              borderRadius: "18px 18px 4px 18px",
              padding: "10px 14px",
              maxWidth: "75%",
              fontSize: 14
            }}>
              {msg.content}
            </div>
          ) : (
            <div key={msg.id} style={{ alignSelf: "flex-start", maxWidth: "82%" }}>
              <div style={{
                background: "#f3f4f6",
                color: "#111",
                borderRadius: "18px 18px 18px 4px",
                padding: "10px 14px",
                fontSize: 14
              }}>
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <details style={{ marginTop: 4 }}>
                  <summary style={{ fontSize: 11, color: "#6b7280", cursor: "pointer" }}>
                    Sources ({msg.sources.length})
                  </summary>
                  {msg.sources.map((s, i) => (
                    <div key={i} style={{
                      fontSize: 11,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "4px 8px",
                      marginTop: 4,
                      color: "#374151"
                    }}>
                      [Video {s.video_id} · Chunk {s.chunk_index}] {s.text_snippet}...
                    </div>
                  ))}
                </details>
              )}
            </div>
          )
        ))}
        {loading && (
          <div style={{
            alignSelf: "flex-start",
            background: "#f3f4f6",
            borderRadius: "18px 18px 18px 4px",
            padding: "10px 14px",
            fontSize: 20,
            color: "#6b7280"
          }}>
            • • •
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Chips */}
      {messages.length === 0 && !disabled && (
        <div style={{ padding: "0 16px 8px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12,
                cursor: "pointer",
                background: "white",
                color: "#374151"
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Row */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 16px", display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          disabled={loading || disabled}
          placeholder="Ask anything about the videos..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            fontSize: 14,
            outline: "none"
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || disabled}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 999,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
