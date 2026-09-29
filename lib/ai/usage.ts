import type { SupabaseClient } from "@supabase/supabase-js";

const DAILY_PARSE_LIMIT = Number(process.env.AI_DAILY_PARSE_PLAN_LIMIT ?? "4");

export async function assertParsePlanQuota(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("ai_usage")
    .select("parse_plan_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  const count = data?.parse_plan_count ?? 0;
  if (count >= DAILY_PARSE_LIMIT) {
    throw new Error(`일일 AI 플랜 파싱 한도(${DAILY_PARSE_LIMIT}회)를 초과했습니다`);
  }
}

export async function recordParsePlanUsage(supabase: SupabaseClient, userId: string) {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("ai_usage")
    .select("parse_plan_count")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  const next = (data?.parse_plan_count ?? 0) + 1;
  const { error } = await supabase.from("ai_usage").upsert(
    {
      user_id: userId,
      usage_date: today,
      parse_plan_count: next,
    },
    { onConflict: "user_id,usage_date" },
  );
  if (error) throw error;
}
