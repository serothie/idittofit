import { GoogleGenAI } from "@google/genai";
import { DEFAULT_GEMINI_MODEL } from "./model";
import { planGenerateResultSchema } from "./schemas/planGenerate";

const SYSTEM = `You write next week's gym plan as plain text (same style as typical CrossFit/ strength weekly plans).
Output ONLY JSON: { "text": "<full plan txt>", "notes"?: string }
Include Mon-Sat dates as headings. Strength use sets/reps/weight or %. WOD use AMRAP/FOR TIME with raw text.`;

export async function generatePlan(input: {
  context: string;
  feedback?: string;
}): Promise<{ text: string; notes?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  const user = [
    input.context,
    input.feedback ? `\nUSER FEEDBACK (apply):\n${input.feedback}` : "",
  ].join("\n");

  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: `${SYSTEM}\n\n---\n${user}`,
  });

  const raw = response.text?.trim() ?? "";
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) throw new Error("AI response did not contain JSON");
  const parsed = planGenerateResultSchema.parse(JSON.parse(raw.slice(jsonStart, jsonEnd + 1)));
  return parsed;
}
