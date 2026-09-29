import { z } from "zod";

export const planGenerateResultSchema = z.object({
  text: z.string().min(1),
  notes: z.string().optional(),
});

export type PlanGenerateResult = z.infer<typeof planGenerateResultSchema>;
