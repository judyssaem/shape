import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import generateShapesHandler from "./api/generate-shapes.ts";
import transcribeSpeechHandler from "./api/transcribe-speech.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.all("/api/generate-shapes", (req, res) => {
  return generateShapesHandler(req, res);
});

app.all("/api/transcribe-speech", (req, res) => {
  return transcribeSpeechHandler(req, res);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
