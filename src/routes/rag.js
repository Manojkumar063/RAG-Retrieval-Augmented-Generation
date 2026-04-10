import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { requireAuth } from "../middleware/auth.js";
import { embedText, retrieve, generate, chunkText } from "../services/rag.js";
import { saveChunk, chunkExists, getAllChunks } from "../services/db.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post("/upload", requireAuth, upload.single("pdf"), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  try {
    const { text } = await pdfParse(req.file.buffer);
    const chunks = chunkText(text, req.file.originalname);
    if (!chunks.length) return res.status(400).json({ error: "No readable text found in PDF" });

    let indexed = 0;
    for (const chunk of chunks) {
      if (!chunkExists(chunk.text)) {
        saveChunk(chunk.text, chunk.source, await embedText(chunk.text));
        indexed++;
      }
    }
    res.json({ message: `Indexed ${indexed} new chunks from "${req.file.originalname}"` });
  } catch (err) {
    next(err);
  }
});

router.post("/ask", requireAuth, async (req, res, next) => {
  const { query } = req.body;
  if (!query?.trim()) return res.status(400).json({ error: "Query is required" });

  try {
    const allChunks = getAllChunks();
    const queryEmbedding = await embedText(query);
    const topChunks = retrieve(queryEmbedding, allChunks.map((c) => c.embedding), allChunks, 4);
    res.json({ answer: await generate(query, topChunks) });
  } catch (err) {
    next(err);
  }
});

export default router;
