import { describe, expect, it } from "vitest";
import { DEFAULT_ATHLETE_SETTINGS } from "@/lib/athlete/settings";
import { estimate1RmKg } from "@/lib/recommend/epley";
import { recommendWeightKg } from "@/lib/recommend/recommendWeight";

describe("estimate1RmKg", () => {
  it("Epley at 5 reps", () => {
    expect(estimate1RmKg(100, 5)).toBeCloseTo(116.67, 1);
  });
});

describe("recommendWeightKg", () => {
  it("uses percent of 1RM", () => {
    const w = recommendWeightKg(
      {
        exerciseKey: "front_squat",
        prescriptionWeight: "70%",
        prescriptionReps: 5,
        oneRmKg: 100,
      },
      DEFAULT_ATHLETE_SETTINGS,
    );
    expect(w).toBe(70);
  });

  it("bumps above last week when target is lower", () => {
    const w = recommendWeightKg(
      {
        exerciseKey: "front_squat",
        prescriptionWeight: "60kg",
        prescriptionReps: 5,
        lastWeekBest: { weightKg: 80, reps: 5 },
      },
      { ...DEFAULT_ATHLETE_SETTINGS, planWeightRatio: 1 },
    );
    expect(w).toBeGreaterThanOrEqual(82.5);
  });
});
