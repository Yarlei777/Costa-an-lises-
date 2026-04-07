import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for Gemini OCR
  app.post("/api/ocr", async (req, res) => {
    try {
      const { base64Image } = req.body;
      if (!base64Image) {
        return res.status(400).json({ error: "No image provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const base64Data = base64Image.split(",")[1] || base64Image;

      const prompt = `
        Analyze this roulette history image. 
        Extract all the numbers in the order they appear, from the most recent to the oldest.
        Usually, the most recent number is at the top-left or top.
        Return ONLY a JSON array of numbers, for example: [35, 15, 11, 26, 12].
        Do not include any text, just the array.
        Numbers must be between 0 and 36.
      `;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/jpeg",
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      
      const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const numbers = JSON.parse(cleanedText);

      if (Array.isArray(numbers)) {
        const validNumbers = numbers.filter(n => typeof n === 'number' && n >= 0 && n <= 36);
        return res.json({ numbers: validNumbers });
      }
      
      res.json({ numbers: [] });
    } catch (error) {
      console.error("Gemini Server Error:", error);
      res.status(500).json({ error: "Failed to process image with Gemini" });
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

startServer();
