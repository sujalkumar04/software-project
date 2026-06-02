# Creator RAG Analyst 🎯

Hey! Welcome to my Creator RAG Analyst project. 

I built this full-stack app to solve a personal frustration: comparing YouTube and Instagram content side-by-side without having to manually watch both, take notes, and compare metrics in Excel. You give it a YouTube URL and an Instagram Reel URL, it grabs the metadata and transcripts, puts them in a local vector database, and lets you ask questions (like *"Which video had a stronger hook?"* or *"Compare their engagement metrics"*) using a chat interface.

---

## 🛠 My Stack

- **Frontend:** React + TypeScript + Vite. I kept it clean and responsive using custom styles, smooth transitions, and added a nice gradient fallback state for when Instagram blocks images (which happens a lot due to their CORS and authentication gates).
- **Backend:** FastAPI. Super fast, simple, and standard for building ML/RAG APIs.
- **RAG & Orchestration:** LangChain (`ConversationalRetrievalChain` with memory to keep track of chat history).
- **Vector DB:** ChromaDB (persisted locally).
- **Embeddings:** `bge-small-en-v1.5` loaded locally via HuggingFace.
- **LLM Engine:** Llama-3.3-70B via Groq (it's incredibly fast, serving answers at >250 tokens per second).

---

## ⚡ Setup & How to Run

### 1. Backend Setup
Make sure you have Python 3.11+ installed.
```bash
cd backend
python -m venv venv
source venv/bin/activate       # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Copy my env template
cp .env.example .env
```
Open `.env` and add your Groq API key (you can grab a free one from [Groq Console](https://console.groq.com)):
```env
GROQ_API_KEY=gsk_your_groq_key_here
CHROMA_PERSIST_DIR=./chroma_db
```
Start the backend:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) and you're good to go!

---

## 🧠 My Design Decisions & Trade-Offs (Why I built it this way)

### Why ChromaDB instead of a cloud database?
To be completely honest, I chose ChromaDB because it is **zero-setup**. It runs locally in a folder inside the backend (`./chroma_db`) using SQLite under the hood. I didn't want to deal with standing up an external database, signing up for Pinecone, or storing API keys for a cloud vector provider. 
* **The Catch:** SQLite uses a global write lock. It works great for me running it locally, but if two people try to ingest videos at the exact same time, the database will lock up and throw an error. If I were building this for production, I'd swap this for Qdrant or Pinecone.

### The Chunking Strategy (500 chars / 50 overlap)
I went with a chunk size of 500 characters and an overlap of 50. 
* **Why?** Video transcripts are conversational. People talk in run-on sentences without punctuation or markdown headings. 
* If I used a tiny chunk size (like 100-200 characters), it would split a single sentence in half, and the retrieval would get random fragments out of context. 
* If I made it too large (like 1500 characters), a 30-second reel's hook would get mixed up with the call-to-action at the end, diluting the search query. 
* The 50-character overlap acts as a safety net so no sentence gets cut cleanly down the middle at a chunk boundary.

### Local Embeddings vs. OpenAI API
I decided to load the `BAAI/bge-small-en-v1.5` model locally. 
* **The pros:** It's 100% free, runs completely offline, and has zero network call latency. Plus, it only uses 384 dimensions. Compared to OpenAI's 1536-dimensional embeddings, 384-dimension math is way faster to search in memory.
* **The cons:** The first time you start the app, it has to download the BGE model. And since it runs on the CPU locally, it eats up a bit of RAM on my machine.

---

## 🚨 What breaks if 10,000 people use this at once?

I wanted to be realistic about this codebase. If this app went viral on Twitter tomorrow, it would immediately crash. Here is exactly what would break and how I would fix it:

1. **The SQLite Bottleneck:** 
   * **Problem:** ChromaDB writes to a local SQLite file. With thousands of users uploading URLs at the same time, SQLite's write locks would freeze the server.
   * **Fix:** Migrate to a dedicated vector database service like Qdrant Cloud or Pinecone, using user session namespaces to keep data separate.
2. **Synchronous thread blocking in FastAPI:** 
   * **Problem:** Right now, when you hit `/ingest`, the FastAPI thread pauses to wait for `yt-dlp` to download the video info and do the scraping. If a download takes 10 seconds, the entire backend is blocked from answering other users' requests.
   * **Fix:** Move the scraping and embedding logic to a background worker queue using Redis and Celery. The `/ingest` route should just return a "Job Started" status, and the frontend can poll a status endpoint while a spinner runs.
3. **Instagram IP Bans:** 
   * **Problem:** Instagram hates scrapers. If 10,000 requests hit Instagram from my single backend server IP, Instagram will immediately flag the IP and start returning `429 Rate Limit` or `403 Forbidden` errors.
   * **Fix:** Route all scraper requests through a rotating proxy service (like BrightData) using residential IPs, and implement cookie session pools.
4. **RAM issues with Local Embeddings:** 
   * **Problem:** Running HuggingFace locally means each FastAPI worker process loads its own copy of the BGE model into RAM. Concurrency spikes will cause Out-Of-Memory (OOM) crashes on the host.
   * **Fix:** Host the BGE model on a central Triton Inference Server, or just swap to a serverless API provider like Cohere Embed or Voyage AI.
