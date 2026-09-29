import { z } from "zod";

export const athleteSettingsSchema = z.object({
  oneRmKg: z.record(z.string(), z.number().positive()).default({}),
  planWeightRatio: z.number().min(0.1).max(2).default(0.85),
  minIncrementKg: z.number().positive().default(2.5),
  plateUnitKg: z.number().positive().default(2.5),
});

export type AthleteSettings = z.infer<typeof athleteSettingsSchema>;

export const DEFAULT_ATHLETE_SETTINGS: AthleteSettings = {
  oneRmKg: {},
  planWeightRatio: 0.85,
  minIncrementKg: 2.5,
  plateUnitKg: 2.5,
};

export function mergeSettings(raw: unknown): AthleteSettings {
  return athleteSettingsSchema.parse({ ...DEFAULT_ATHLETE_SETTINGS, ...(raw as object) });
}
