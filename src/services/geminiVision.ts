export async function extractNumbersFromImage(base64Image: string): Promise<number[]> {
  try {
    const response = await fetch("/api/ocr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process image");
    }

    const data = await response.json();
    return data.numbers || [];
  } catch (error) {
    console.error("Gemini Vision Fetch Error:", error);
    throw error;
  }
}
