/** 종목 별칭 → 정규 key (MVP 시드) */
export const EXERCISE_ALIASES: Record<string, string> = {
  fs: "front_squat",
  프스: "front_squat",
  프론트스쿼트: "front_squat",
  "front squat": "front_squat",
  "front sqaut": "front_squat",
  bs: "back_squat",
  백스쿼트: "back_squat",
  "back squat": "back_squat",
  dl: "deadlift",
  데드: "deadlift",
  데드리프트: "deadlift",
  deadlift: "deadlift",
};

export function resolveExerciseKey(label: string): string | undefined {
  const norm = label.trim().toLowerCase();
  if (EXERCISE_ALIASES[norm]) return EXERCISE_ALIASES[norm];
  for (const [alias, key] of Object.entries(EXERCISE_ALIASES)) {
    if (norm.startsWith(alias) || norm.includes(alias)) return key;
  }
  return undefined;
}
