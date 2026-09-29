import type { AthleteSettings } from "@/lib/athlete/settings";
import { estimate1RmKg, roundToPlate } from "./epley";

export type RecommendInput = {
  exerciseKey: string;
  prescriptionWeight?: string | number | null;
  prescriptionReps?: number | null;
  lastWeekBest?: { weightKg: number; reps: number } | null;
  oneRmKg?: number | null;
};

export function parsePercentWeight(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (m) return Number(m[1]) / 100;
  return null;
}

export function parseNumericKg(raw: string | number | null | undefined): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (raw == null) return null;
  const s = String(raw).replace(/,/g, "").trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(kg|#|lb|키로)?$/i);
  if (m) {
    let n = Number(m[1]);
    const unit = (m[2] ?? "kg").toLowerCase();
    if (unit === "#" || unit === "lb") n = n * 0.453592;
    return n;
  }
  return null;
}

/** PLAN.md 추천 무게 (MVP: 증량·%·1RM cap·원판 반올림) */
export function recommendWeightKg(
  input: RecommendInput,
  settings: AthleteSettings,
): number | null {
  const oneRm =
    input.oneRmKg ??
    settings.oneRmKg[input.exerciseKey] ??
    (input.lastWeekBest
      ? estimate1RmKg(input.lastWeekBest.weightKg, input.lastWeekBest.reps)
      : null);

  const pct = parsePercentWeight(input.prescriptionWeight);
  let target: number | null = null;

  if (pct != null && oneRm != null) {
    target = oneRm * pct;
  } else {
    const marked = parseNumericKg(input.prescriptionWeight);
    if (marked != null) target = marked * settings.planWeightRatio;
  }

  if (target == null) return null;

  const last = input.lastWeekBest;
  if (last) {
    const lastEst = estimate1RmKg(last.weightKg, last.reps);
    const targetEst = estimate1RmKg(target, input.prescriptionReps ?? last.reps);
    if (targetEst <= lastEst) {
      target = last.weightKg + settings.minIncrementKg;
    }
  }

  if (oneRm != null && target > oneRm) target = oneRm;

  return roundToPlate(target, settings.plateUnitKg);
}
