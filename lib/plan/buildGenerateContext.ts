import type { SupabaseClient } from "@supabase/supabase-js";

export async function buildGenerateContext(
  supabase: SupabaseClient,
  athleteId: string,
): Promise<string> {
  const { data: days } = await supabase
    .from("plan_days")
    .select("plan_date, week_label, source_text")
    .eq("athlete_id", athleteId)
    .order("plan_date", { ascending: false })
    .limit(7);

  const blocks = (days ?? []).map(
    (d) => `${d.plan_date} ${d.week_label ?? ""}\n${d.source_text?.slice(0, 2000) ?? "(no text)"}`,
  );

  return `Recent plan days (newest first):\n\n${blocks.join("\n\n---\n\n")}`;
}
