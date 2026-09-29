import { z } from "zod";

export const plannedEntrySchema = z.object({
  exerciseKey: z.string().optional(),
  label: z.string().optional(),
  prescription: z.record(z.string(), z.any()).default({}),
});

export const planPartSchema = z.object({
  partType: z.string().default("block"),
  rawText: z.string().optional(),
  scoreText: z.string().optional(),
  entries: z.array(plannedEntrySchema).default([]),
});

export const planDaySchema = z.object({
  planDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekLabel: z.string().optional(),
  parts: z.array(planPartSchema).default([]),
});

export const planParseResultSchema = z.object({
  days: z.array(planDaySchema).min(1),
  notes: z.string().optional(),
});

export type PlanParseResult = z.infer<typeof planParseResultSchema>;
