import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getSalonInfo(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Error fetching salon info:", error);
    return "Could not fetch salon information at this time.";
  }
}
