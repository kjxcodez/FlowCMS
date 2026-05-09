import { NextRequest } from "next/server";
import { requireWorkspace } from "@/lib/session";
import { apiError, apiSuccess } from "@/types/api";
import { generateJsonAIResponse } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    // Verify session and workspace access
    await requireWorkspace();
    
    const { content, context = "" } = await req.json();

    if (!content || content.length < 20) {
      return apiError("INVALID_INPUT", "Insufficient content for AI metadata generation.");
    }

    const prompt = `
      Act as an elite SEO Strategist for a high-authority publication. 
      Analyze the content provided and generate optimized SEO metadata.
      
      RULES:
      - Title: Max 60 characters, high CTR, include primary keyword.
      - Description: Max 160 characters, compelling summary, clear value proposition.
      - Style: Professional, industrial, direct.
      
      ${context ? `ADDITIONAL CONTEXT: ${context}` : ""}
      
      CONTENT TO ANALYZE:
      ${content.substring(0, 8000)}
      
      Return as JSON: { "title": "...", "description": "..." }
    `;

    const result = await generateJsonAIResponse<{ title: string; description: string }>(prompt);
    
    return apiSuccess(result);
  } catch (err) {
    console.error("[AI_SEO_ERROR]", err);
    return apiError("INTERNAL_ERROR", "Failed to generate AI SEO metadata.");
  }
}
