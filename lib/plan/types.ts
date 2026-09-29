export type PlanEntryView = {
  id: string;
  exerciseKey?: string;
  label?: string;
  prescription: Record<string, unknown>;
};

export type PlanPartView = {
  id: string;
  partType: string;
  rawText?: string;
  scoreText?: string;
  entries: PlanEntryView[];
};

export type PlanDayView = {
  id: string;
  planDate: string;
  weekLabel?: string;
  parts: PlanPartView[];
};

export type LogSetInput = {
  plannedEntryId?: string;
  planPartId?: string;
  exerciseKey?: string;
  label?: string;
  reps?: number | null;
  weight?: number | null;
  weightUnit?: string | null;
  rawLine?: string | null;
  wodScore?: string | null;
};

export type LogSetView = {
  id: string;
  reps: number | null;
  weight: number | null;
  weightUnit: string | null;
  rawLine: string | null;
  exerciseKey?: string;
};
