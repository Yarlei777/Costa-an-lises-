import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // AI OCR Proxy
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image, prompt } = req.body;
      if (!image) return res.status(400).json({ error: "No image provided" });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(401).json({ error: "API Key missing" });

      const ai = new GoogleGenAI({ apiKey }) as any;
      const model = ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      const response = await model.generateContent({
        contents: [{
          parts: [
            { inlineData: { mimeType: "image/png", data: image } },
            { text: prompt || "Extract roulette numbers (0-36). Return ONLY JSON array of integers." }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const text = response.response.text();
      res.json({ result: JSON.parse(text) });
    } catch (error) {
      console.error("AI Proxy Error:", error);
      res.status(500).json({ error: "Failed to process image with AI" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server error:", err);
  process.exit(1);
});
