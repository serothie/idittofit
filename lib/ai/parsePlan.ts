import { GoogleGenAI } from "@google/genai";
import { DEFAULT_GEMINI_MODEL } from "./model";
import { planParseResultSchema, type PlanParseResult } from "./schemas/planParse";

const SYSTEM = `You parse gym plan text into JSON. Output ONLY valid JSON matching the schema:
{ "days": [ { "planDate": "YYYY-MM-DD", "weekLabel"?: string, "parts": [ { "partType": string, "rawText"?: string, "scoreText"?: string, "entries": [ { "exerciseKey"?: string, "label"?: string, "prescription": object } ] } ] } ], "notes"?: string }
Use partType "wod" for metcon with rawText holding the full WOD. Strength blocks use entries with prescription for sets/reps/weight/tempo.`;

export async function parsePlan(text: string): Promise<PlanParseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: `${SYSTEM}\n\n---\nPLAN TEXT:\n${text}`,
  });

  const raw = response.text?.trim() ?? "";
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart < 0 || jsonEnd < 0) {
    throw new Error("AI response did not contain JSON");
  }
  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as unknown;
  return planParseResultSchema.parse(parsed);
}
