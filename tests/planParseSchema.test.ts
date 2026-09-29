import { describe, expect, it } from "vitest";
import { planParseResultSchema } from "@/lib/ai/schemas/planParse";

const samples = [
  {
    days: [
      {
        planDate: "2026-10-01",
        parts: [{ partType: "strength", entries: [{ label: "FS", prescription: { sets: 5 } }] }],
      },
    ],
  },
  {
    days: [
      {
        planDate: "2026-10-02",
        weekLabel: "load-1",
        parts: [{ partType: "wod", rawText: "AMRAP 12 min: 10 burpees" }],
      },
    ],
  },
  {
    days: [
      { planDate: "2026-10-03", parts: [] },
      { planDate: "2026-10-04", parts: [{ partType: "skill", rawText: "MU practice" }] },
    ],
  },
  {
    days: [
      {
        planDate: "2026-10-05",
        parts: [
          {
            partType: "strength",
            entries: [{ exerciseKey: "front_squat", prescription: { reps: 5, weight: "70%" } }],
          },
        ],
      },
    ],
  },
  {
    days: [
      {
        planDate: "2026-10-06",
        parts: [{ partType: "wod", rawText: "FOR TIME", scoreText: "cap 15:00" }],
      },
    ],
    notes: "deload",
  },
];

describe("planParseResultSchema", () => {
  it.each(samples.map((s, i) => [i + 1, s] as const))("accepts fixture %i", (_n, sample) => {
    expect(planParseResultSchema.parse(sample).days.length).toBeGreaterThan(0);
  });
});
