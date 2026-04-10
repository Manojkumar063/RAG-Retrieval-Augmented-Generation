import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(__dirname, "../../");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "rag.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export const createUser = (username, email, hashedPassword) =>
  db.prepare("INSERT INTO users (username, email, password) VALUES (?,?,?)").run(username, email, hashedPassword);

export const findUserByEmail = (email) =>
  db.prepare("SELECT * FROM users WHERE email = ?").get(email);

export const findUserByUsername = (username) =>
  db.prepare("SELECT * FROM users WHERE username = ?").get(username);

// ── Chunk store (JSON) ────────────────────────────────────────────────────────
const CHUNKS_FILE = path.join(DATA_DIR, "chunks-store.json");
let chunksStore = fs.existsSync(CHUNKS_FILE)
  ? JSON.parse(fs.readFileSync(CHUNKS_FILE, "utf-8"))
  : [];

const saveChunksFile = () => fs.writeFileSync(CHUNKS_FILE, JSON.stringify(chunksStore));

export const saveChunk = (text, source, embedding) => {
  chunksStore.push({ text, source, embedding });
  saveChunksFile();
};

export const chunkExists = (text) => chunksStore.some((c) => c.text === text);

export const getAllChunks = () => chunksStore;
