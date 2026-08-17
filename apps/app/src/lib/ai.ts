import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

if (!process.env.GEMINI_API_KEY) {
  logger.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Using Gemini 2.0 Flash for best speed/free tier balance
export const aiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateAIResponse(prompt: string) {
  try {
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    logger.error("AI Generation Failed", { error: String(err) });
    throw err;
  }
}

export async function generateJsonAIResponse<T>(prompt: string): Promise<T> {
  const fullPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanations.`;
  const text = await generateAIResponse(fullPrompt);
  try {
    // Clean potential markdown code blocks
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    logger.error("AI JSON Parse Failed", { error: String(err), raw: text });
    throw new Error("Failed to parse AI response as JSON.");
  }
}
