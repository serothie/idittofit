import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { DEFAULT_GEMINI_MODEL } from "./model";

const lineSchema = z.object({
  label: z.string(),
  exerciseKey: z.string().optional(),
  reps: z.number().optional(),
  weight: z.number().optional(),
  weightUnit: z.string().optional(),
});

const batchSchema = z.object({
  lines: z.array(lineSchema),
});

export async function parseMemoLinesWithAi(failedLines: string[]): Promise<
  Array<{
    label: string;
    exerciseKey?: string;
    reps?: number;
    weight?: number;
    weightUnit?: string;
    rawLine: string;
  }>
> {
  if (!failedLines.length) return [];
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: DEFAULT_GEMINI_MODEL,
    contents: `Parse each gym log line to JSON. Output ONLY {"lines":[...]} same order as input.
Fields: label, exerciseKey (snake_case if known), reps, weight, weightUnit.

LINES:
${failedLines.map((l, i) => `${i + 1}. ${l}`).join("\n")}`,
  });

  const raw = response.text?.trim() ?? "";
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  const parsed = batchSchema.parse(JSON.parse(raw.slice(jsonStart, jsonEnd + 1)));

  return parsed.lines.map((line, i) => ({
    ...line,
    rawLine: failedLines[i] ?? line.label,
  }));
}
