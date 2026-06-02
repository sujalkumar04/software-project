import React, { useState } from 'react';
import { VideoMeta } from '../api/client';

interface VideoCardProps {
  label: 'A' | 'B';
  video: VideoMeta | null;
  loading: boolean;
}

export default function VideoCard({ label, video, loading }: VideoCardProps) {
  const [imgError, setImgError] = useState(false);
  const styles = (
    <style>{`
      @keyframes pulse { from { opacity: 0.5 } to { opacity: 1 } }
      .skeleton { animation: pulse 1s infinite alternate; background: #e2e8f0; border-radius: 8px; }
    `}</style>
  );

  const containerStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    minWidth: '280px',
    flex: '1'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        {styles}
        <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '12px' }}>Video {label}</div>
        <div className="skeleton" style={{ height: '180px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '16px', width: '80%', marginBottom: '12px' }} />
        <div className="skeleton" style={{ height: '14px', width: '60%', marginBottom: '12px' }} />
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ ...containerStyle, justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        {styles}
        <div style={{ color: '#94a3b8', fontSize: '14px' }}>No video loaded yet</div>
      </div>
    );
  }

  const {
    platform,
    title,
    creator,
    views,
    likes,
    comments,
    engagement_rate,
    upload_date,
    duration_seconds,
    hashtags,
    thumbnail_url,
    follower_count
  } = video;

  const labelBg = label === 'A' ? '#2563eb' : '#16a34a';
  const platformBg = platform.toLowerCase() === 'youtube' ? '#dc2626' : '#7c3aed';

  const mins = Math.floor(duration_seconds / 60);
  const secs = duration_seconds % 60;
  const formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div style={containerStyle}>
      {styles}
      {/* 1. Badge Row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{
          background: labelBg,
          color: 'white',
          fontSize: '12px',
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: '999px'
        }}>
          Video {label}
        </span>
        <span style={{
          background: platformBg,
          color: 'white',
          fontSize: '11px',
          padding: '3px 8px',
          borderRadius: '999px',
          textTransform: 'capitalize'
        }}>
          {platform}
        </span>
      </div>

      {/* 2. Thumbnail — 3-tier fallback:
           1st: real thumbnail_url (YouTube maxresdefault or Instagram CDN via weserv proxy)
           2nd: picsum.photos seeded by video_id (always loads, stable per post)
           3rd: branded gradient placeholder (only if both above fail) */}
      {(() => {
        const shortSeed = video.video_id
          ? Math.abs(video.video_id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 1000
          : 42;
        const picsumUrl = `https://picsum.photos/seed/${shortSeed}/640/360`;

        // Resolve the src to use
        let src: string | null = null;
        if (!imgError && thumbnail_url) {
          src = platform.toLowerCase() === 'instagram' && thumbnail_url.includes('cdninstagram')
            ? `https://images.weserv.nl/?url=${encodeURIComponent(thumbnail_url)}&w=640&h=360&fit=cover`
            : thumbnail_url;
        } else if (!imgError && !thumbnail_url) {
          // No thumbnail_url at all — go straight to picsum
          src = picsumUrl;
        } else {
          // imgError true: real URL failed, try picsum
          src = picsumUrl;
        }

        return (
          <img
            key={src}  // remount when src changes so onError fires fresh
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            src={src!}
            onError={() => {
              if (!imgError) setImgError(true);
              // If even picsum fails (very unlikely), show gradient below
            }}
            style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }}
            alt={title}
          />
        );
      })()}

      {/* 3. Title */}
      <div style={{
        fontSize: '15px',
        fontWeight: 600,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        lineHeight: '1.4'
      }}>
        {title}
      </div>

      {/* 4. Creator Row */}
      <div style={{ fontSize: '13px', color: '#374151' }}>
        👤 {creator} {follower_count !== null ? ` · ${follower_count.toLocaleString()} followers` : ''}
      </div>

      {/* 5. Stats Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6b7280' }}>
        <span>👁 {views.toLocaleString()}</span>
        <span>❤️ {likes.toLocaleString()}</span>
        <span>💬 {comments.toLocaleString()}</span>
      </div>

      {/* 6. Engagement Rate Box */}
      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>{engagement_rate}%</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>Engagement Rate</div>
      </div>

      {/* 7. Footer */}
      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
        {upload_date} · {formattedDuration}
      </div>

      {/* 8. Hashtags */}
      {hashtags && hashtags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {hashtags.slice(0, 5).map((tag, i) => (
            <span key={i} style={{
              background: '#f3f4f6',
              borderRadius: '999px',
              fontSize: '11px',
              padding: '2px 8px',
              color: '#374151'
            }}>
              {tag}
            </span>
          ))}
          {hashtags.length > 5 && (
            <span style={{
              background: '#f3f4f6',
              borderRadius: '999px',
              fontSize: '11px',
              padding: '2px 8px',
              color: '#6b7280'
            }}>
              +{hashtags.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
