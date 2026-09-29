import type { PlanDayView, PlanEntryView, PlanPartView } from "@/lib/plan/types";
import type { SupabaseClient } from "@supabase/supabase-js";

function entryFromRow(row: {
  id: string;
  prescription: Record<string, unknown> | null;
}): PlanEntryView {
  const rx = { ...(row.prescription ?? {}) };
  const exerciseKey = typeof rx.exerciseKey === "string" ? rx.exerciseKey : undefined;
  const label = typeof rx.label === "string" ? rx.label : undefined;
  delete rx.exerciseKey;
  delete rx.label;
  return { id: row.id, exerciseKey, label, prescription: rx };
}

export async function loadPlanDayForAthlete(
  supabase: SupabaseClient,
  athleteId: string,
  planDate: string,
): Promise<PlanDayView | null> {
  const { data: dayRow } = await supabase
    .from("plan_days")
    .select("id, plan_date, week_label")
    .eq("athlete_id", athleteId)
    .eq("plan_date", planDate)
    .maybeSingle();

  if (!dayRow) return null;

  const { data: partsRows } = await supabase
    .from("plan_parts")
    .select("id, part_type, raw_text, score_text, sort_order")
    .eq("plan_day_id", dayRow.id)
    .order("sort_order");

  const parts: PlanPartView[] = [];
  for (const p of partsRows ?? []) {
    const { data: entryRows } = await supabase
      .from("planned_entries")
      .select("id, prescription, sort_order")
      .eq("plan_part_id", p.id)
      .order("sort_order");

    parts.push({
      id: p.id,
      partType: p.part_type,
      rawText: p.raw_text ?? undefined,
      scoreText: p.score_text ?? undefined,
      entries: (entryRows ?? []).map(entryFromRow),
    });
  }

  return {
    id: dayRow.id,
    planDate: dayRow.plan_date,
    weekLabel: dayRow.week_label ?? undefined,
    parts,
  };
}
