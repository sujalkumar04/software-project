import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs

def extract_video_id(url: str) -> str:
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    if 'v' in qs:
        return qs['v'][0]
    # Fallback to last 11 characters of path
    path = parsed.path.strip('/')
    if len(path) >= 11:
        return path[-11:]
    return path

def fetch(url: str) -> dict:
    try:
        video_id = extract_video_id(url)
        if not video_id:
            raise ValueError("Could not extract video ID from the provided URL")

        # Fetch metadata using yt-dlp
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(url, download=False)
            except Exception as e:
                raise ValueError(f"yt-dlp failed to extract info: {str(e)}")

        title = info.get('title') or ""
        creator = info.get('uploader') or ""
        views = int(info.get('view_count') or 0)
        likes = int(info.get('like_count') or 0)
        comments = int(info.get('comment_count') or 0)
        upload_date = info.get('upload_date') or ""
        duration_seconds = int(info.get('duration') or 0)
        hashtags = info.get('tags') or []
        thumbnail_url = info.get('thumbnail') or ""

        # Compute engagement_rate = round((like_count + comment_count) / view_count * 100, 4)
        if views == 0:
            engagement_rate = 0.0
        else:
            engagement_rate = round((likes + comments) / views * 100, 4)

        # Fetch transcript
        transcript = []
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
            for entry in transcript_list:
                transcript.append({
                    "text": str(entry.get("text", "")),
                    "start": float(entry.get("start", 0.0)),
                    "duration": float(entry.get("duration", 0.0))
                })
        except Exception:
            transcript = []

        return {
            "video_id": video_id,
            "platform": "youtube",
            "url": url,
            "title": title,
            "creator": creator,
            "views": views,
            "likes": likes,
            "comments": comments,
            "engagement_rate": engagement_rate,
            "upload_date": upload_date,
            "duration_seconds": duration_seconds,
            "hashtags": hashtags,
            "thumbnail_url": thumbnail_url,
            "follower_count": None,
            "transcript": transcript
        }
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to fetch YouTube data: {str(e)}")
