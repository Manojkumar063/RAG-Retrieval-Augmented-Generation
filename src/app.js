import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import ragRoutes from "./routes/rag.js";
import { errorHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

const app = express();

app.use(morgan(":method :url :status :res[content-length] bytes - :response-time ms"));
app.use(express.json());
app.use(express.static(publicDir));

app.get("/", (_, res) => res.sendFile(path.join(publicDir, "auth.html")));
app.get("/chat", (_, res) => res.sendFile(path.join(publicDir, "chat.html")));

app.use("/api/auth", authRoutes);
app.use("/api", ragRoutes);

app.use(errorHandler);

export default app;
