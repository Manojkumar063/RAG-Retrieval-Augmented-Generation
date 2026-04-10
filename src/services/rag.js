import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(__dirname, "../../");
const CACHE_FILE = path.resolve(DATA_DIR, "embeddings-cache.json");

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;
const MIN_CHUNK_LEN = 60;
const SCORE_THRESHOLD = 0.3;

function splitWithOverlap(text, source) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const chunk = text.slice(start, start + CHUNK_SIZE).trim();
    if (chunk.length >= MIN_CHUNK_LEN) chunks.push({ text: chunk, source });
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

export const loadDocuments = (docsDir) =>
  fs.readdirSync(docsDir).flatMap((file) =>
    splitWithOverlap(fs.readFileSync(path.join(docsDir, file), "utf-8"), file)
  );

export const chunkText = (text, source) => splitWithOverlap(text, source);

// ── Embedding with cache ──────────────────────────────────────────────────────
const embeddingCache = fs.existsSync(CACHE_FILE)
  ? JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"))
  : {};

const saveCache = () => fs.writeFileSync(CACHE_FILE, JSON.stringify(embeddingCache));

export async function embedText(text) {
  if (embeddingCache[text]) return embeddingCache[text];
  const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
  const result = await model.embedContent(text);
  embeddingCache[text] = result.embedding.values;
  saveCache();
  return embeddingCache[text];
}

// ── Retrieval ─────────────────────────────────────────────────────────────────
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const mag = (v) => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return dot / (mag(a) * mag(b));
}

export const retrieve = (queryEmbedding, chunkEmbeddings, chunks, topK = 4) =>
  chunks
    .map((chunk, i) => ({ ...chunk, score: cosineSimilarity(queryEmbedding, chunkEmbeddings[i]) }))
    .filter((c) => c.score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

// ── Generation ────────────────────────────────────────────────────────────────
export async function generate(query, contextChunks) {
  if (!contextChunks.length)
    return "I don't have enough relevant information to answer that question.";

  const context = contextChunks
    .map((c, i) => `[Source ${i + 1} — ${c.source} (score: ${c.score.toFixed(2)})]:\n${c.text}`)
    .join("\n\n");

  const prompt = `You are a helpful assistant. Answer ONLY using the context below. \
If the answer is not in the context, say "I don't know based on the provided documents."

Context:
${context}

Question: ${query}

Answer (cite sources like [Source 1], [Source 2] where relevant):`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
