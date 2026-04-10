import "./src/config/env.js";
import path from "path";
import { fileURLToPath } from "url";
import app from "./src/app.js";
import { loadDocuments, embedText } from "./src/services/rag.js";
import { saveChunk, chunkExists } from "./src/services/db.js";
import { config } from "./src/config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  console.log("📄 Indexing documents...");
  const chunks = loadDocuments(path.join(__dirname, "documents"));
  for (const chunk of chunks) {
    if (!chunkExists(chunk.text)) {
      saveChunk(chunk.text, chunk.source, await embedText(chunk.text));
    }
  }
  console.log("✅ Documents indexed.\n");

  app.listen(config.port, () =>
    console.log(`🚀 Server running at http://localhost:${config.port}`)
  );
}

bootstrap().catch((err) => {
  console.error("❌ Startup failed:", err.message);
  process.exit(1);
});
