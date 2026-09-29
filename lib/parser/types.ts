export type ParsedMemoLine = {
  ok: true;
  exerciseKey?: string;
  label: string;
  reps?: number;
  weight?: number;
  weightUnit?: string;
  rawLine: string;
};

export type FailedMemoLine = {
  ok: false;
  rawLine: string;
  reason: string;
};

export type MemoParseResult = ParsedMemoLine | FailedMemoLine;
