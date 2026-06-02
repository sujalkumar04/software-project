from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
import os
import chromadb
from dotenv import load_dotenv
load_dotenv()

_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
    return _embeddings

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")

def chunk_and_embed(video_data: dict, label: str) -> int:
    # Build full_text from transcript
    full_text = " ".join([t["text"] for t in video_data["transcript"]])
    
    # If empty, fallback to title + creator + hashtags
    if not full_text.strip():
        full_text = video_data["title"] + " " + video_data["creator"] + " " + " ".join(video_data["hashtags"])
    
    # Chunk text
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = text_splitter.split_text(full_text)
    
    if not chunks:
        return 0
        
    metadatas = []
    ids = []
    for i, chunk in enumerate(chunks):
        metadata = {
            "video_id": label,
            "platform": video_data["platform"],
            "creator": video_data["creator"],
            "title": video_data["title"],
            "views": int(video_data["views"]),
            "likes": int(video_data["likes"]),
            "comments": int(video_data["comments"]),
            "engagement_rate": float(video_data["engagement_rate"]),
            "upload_date": video_data["upload_date"],
            "hashtags": ", ".join(video_data["hashtags"]),
            "follower_count": str(video_data.get("follower_count") or "N/A"),
            "chunk_index": i
        }
        metadatas.append(metadata)
        ids.append(f"{label}_chunk_{i}")
        
    db = Chroma(
        collection_name="video_transcripts",
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_DIR
    )
    db.add_texts(texts=chunks, metadatas=metadatas, ids=ids)
    return len(chunks)

def get_retriever():
    db = Chroma(
        collection_name="video_transcripts",
        embedding_function=get_embeddings(),
        persist_directory=CHROMA_DIR
    )
    return db.as_retriever(search_kwargs={"k": 4})

def clear_collection():
    client = chromadb.PersistentClient(path=CHROMA_DIR)
    try:
        client.delete_collection(name="video_transcripts")
    except Exception:
        pass
    client.get_or_create_collection(name="video_transcripts")
