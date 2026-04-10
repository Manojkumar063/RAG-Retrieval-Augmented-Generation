# Gemini RAG (Retrieval Augmented Generation)

A production-structured RAG pipeline using Google Gemini API.

## Project Structure

```
src/
  config/env.js          → env validation & config
  services/rag.js        → chunking, embedding, retrieval, generation
  services/db.js         → SQLite (users) + JSON chunk store
  middleware/auth.js     → JWT auth guard
  middleware/errorHandler.js → centralized error handling
  routes/auth.js         → POST /api/auth/register, /api/auth/login
  routes/rag.js          → POST /api/upload, /api/ask
  app.js                 → Express app (no listen)
server.js                → entry point (startup indexing + listen)
documents/               → .txt files auto-indexed on startup
public/                  → static frontend
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your keys to `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   JWT_SECRET=your_secret_here
   PORT=3001
   ```

## Usage

```bash
# Development (with --watch)
npm run dev

# Production
npm start
```

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT token |
| POST | `/api/upload` | Bearer | Upload & index PDF |
| POST | `/api/ask` | Bearer | Query the RAG pipeline |

## How it works

```
Documents → Chunks → Embeddings (gemini-embedding-001)
                          ↓
Query → Embedding → Cosine Similarity → Top-K Chunks
                                              ↓
                                    Gemini 2.5 Flash → Answer
```

## Add your own documents

Drop any `.txt` files into the `documents/` folder — they are auto-indexed on startup.
