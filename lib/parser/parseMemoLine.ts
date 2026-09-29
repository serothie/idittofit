import { resolveExerciseKey } from "@/lib/notation/exercises/aliases";
import type { MemoParseResult } from "./types";

function parseWeight(raw: string): { weight: number; unit: string } | null {
  const m = raw.match(/(\d+(?:\.\d+)?)\s*(#|kg|lb|키로|파운드)?/i);
  if (!m) return null;
  let w = Number(m[1]);
  const u = (m[2] ?? "kg").toLowerCase();
  if (u === "#" || u === "lb") {
    return { weight: w * 0.453592, unit: "kg" };
  }
  return { weight: w, unit: "kg" };
}

/** 규칙 기반 한 줄 메모 파서 (MVP) */
export function parseMemoLine(line: string): MemoParseResult {
  const rawLine = line.trim();
  if (!rawLine || rawLine.startsWith("#")) {
    return { ok: false, rawLine, reason: "empty" };
  }

  // FS 5x5 135#
  let m = rawLine.match(/^(.+?)\s+(\d+)\s*[xX×]\s*(\d+)\s+(\d+)\s*#?$/);
  if (m) {
    const label = m[1].trim();
    const key = resolveExerciseKey(label);
    const w = parseWeight(m[4] + "#");
    return {
      ok: true,
      label,
      exerciseKey: key,
      reps: Number(m[3]),
      weight: w?.weight,
      weightUnit: "kg",
      rawLine,
    };
  }

  // 5x5 60kg
  m = rawLine.match(/^(.+?)\s+(\d+)\s*[xX×]\s*(\d+)\s+(\d+(?:\.\d+)?)\s*(kg|#|lb|키로)?/i);
  if (m) {
    const label = m[1].trim();
    const w = parseWeight(`${m[4]}${m[5] ?? "kg"}`);
    return {
      ok: true,
      label,
      exerciseKey: resolveExerciseKey(label),
      reps: Number(m[3]),
      weight: w?.weight,
      weightUnit: w?.unit ?? "kg",
      rawLine,
    };
  }

  // DL 3x5 225 lb
  m = rawLine.match(/^(.+?)\s+(\d+)\s*[xX×]\s*(\d+)\s+(.+)$/i);
  if (m) {
    const tail = m[4].trim();
    const w = parseWeight(tail);
    if (w) {
      return {
        ok: true,
        label: m[1].trim(),
        exerciseKey: resolveExerciseKey(m[1]),
        reps: Number(m[3]),
        weight: w.weight,
        weightUnit: w.unit,
        rawLine,
      };
    }
  }

  // 풀업 5x8 (weightless)
  m = rawLine.match(/^(.+?)\s+(\d+)\s*[xX×]\s*(\d+)\s*$/);
  if (m) {
    return {
      ok: true,
      label: m[1].trim(),
      exerciseKey: resolveExerciseKey(m[1]),
      reps: Number(m[3]),
      rawLine,
    };
  }

  return { ok: false, rawLine, reason: "no_match" };
}

export function parseMemoText(text: string): MemoParseResult[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseMemoLine);
}
