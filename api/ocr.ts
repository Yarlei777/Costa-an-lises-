import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      return res.status(200).json({ numbers: validNumbers });
    }
    
    res.status(200).json({ numbers: [] });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to process image with Gemini" });
  }
}
