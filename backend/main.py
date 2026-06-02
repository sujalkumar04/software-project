from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from ingestion.youtube_fetcher import fetch as youtube_fetch
from ingestion.instagram_fetcher import fetch as instagram_fetch
from vectorstore import embedder
from rag import chain as rag_chain

# Request models
class IngestRequest(BaseModel):
    youtube_url: str
    instagram_url: str

class ChatRequest(BaseModel):
    message: str

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.videos = {"A": None, "B": None}
    yield

app = FastAPI(lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/ingest")
def ingest_videos(body: IngestRequest):
    try:
        print("[Backend] >>> Received ingestion request")
        print(f"[Backend] Step 1: Fetching YouTube metadata and transcript: {body.youtube_url}")
        video_a = youtube_fetch(body.youtube_url)
        print("[Backend] >>> YouTube fetching succeeded!")
        
        print(f"[Backend] Step 2: Fetching Instagram metadata: {body.instagram_url}")
        video_b = instagram_fetch(body.instagram_url)
        print("[Backend] >>> Instagram fetching succeeded!")
        
        print("[Backend] Step 3: Rebuilding ChromaDB vector collections...")
        embedder.clear_collection()
        
        print("[Backend] Step 4: Resetting RAG retrieval chain singleton...")
        rag_chain.reset_chain()
        
        print("[Backend] Step 5: Chunking & Embedding Video A (YouTube)...")
        embedder.chunk_and_embed(video_a, "A")
        
        print("[Backend] Step 6: Chunking & Embedding Video B (Instagram)...")
        embedder.chunk_and_embed(video_b, "B")
        
        a_meta = {k: v for k, v in video_a.items() if k != "transcript"}
        b_meta = {k: v for k, v in video_b.items() if k != "transcript"}
        app.state.videos = {"A": a_meta, "B": b_meta}
        
        print("[Backend] >>> Ingestion completed successfully!")
        return {"status": "success", "video_a": a_meta, "video_b": b_meta}
    except Exception as e:
        print(f"[Backend] !!! INGESTION FAILED with error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/chat")
def chat_query(body: ChatRequest):
    try:
        chain = rag_chain.get_chain()
        result = rag_chain.ask(body.message, chain)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos")
def get_videos():
    try:
        return app.state.videos
    except Exception:
        return {"A": None, "B": None}
