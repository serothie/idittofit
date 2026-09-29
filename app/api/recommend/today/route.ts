import { kstDayBoundsUtcIso, parsePlanDate, todayKstDate } from "@/lib/dates/dayBounds";
import { ensureAthlete } from "@/lib/athlete";
import { mergeSettings } from "@/lib/athlete/settings";
import { loadPlanDayForAthlete } from "@/lib/plan/loadPlanDay";
import { recommendWeightKg } from "@/lib/recommend/recommendWeight";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00+09:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date =
    parsePlanDate(new URL(request.url).searchParams.get("date")) ?? todayKstDate();

  const athleteId = await ensureAthlete(supabase, user.id);
  const { data: athleteRow } = await supabase
    .from("athletes")
    .select("settings")
    .eq("id", athleteId)
    .single();
  const settings = mergeSettings(athleteRow?.settings);

  const day = await loadPlanDayForAthlete(supabase, athleteId, date);
  if (!day) return NextResponse.json({ ok: true, date, recommendations: [] });

  const lastWeekDate = addDays(date, -7);
  const { start, end } = kstDayBoundsUtcIso(lastWeekDate);

  const recommendations: Array<{
    plannedEntryId: string;
    exerciseKey?: string;
    label?: string;
    recommendKg: number | null;
  }> = [];

  for (const part of day.parts) {
    for (const e of part.entries) {
      const key = e.exerciseKey ?? e.label ?? "unknown";
      let lastWeekBest: { weightKg: number; reps: number } | null = null;

      if (e.exerciseKey) {
        const { data: ex } = await supabase
          .from("exercises")
          .select("id")
          .eq("key", e.exerciseKey)
          .maybeSingle();
        if (ex?.id) {
          const { data: logs } = await supabase
            .from("logged_sets")
            .select("weight_kg, reps, weight")
            .eq("athlete_id", athleteId)
            .eq("exercise_id", ex.id)
            .gte("performed_at", start)
            .lte("performed_at", end)
            .order("weight_kg", { ascending: false })
            .limit(1);
          const row = logs?.[0];
          if (row) {
            const w = Number(row.weight_kg ?? row.weight ?? 0);
            const r = Number(row.reps ?? 5);
            if (w > 0) lastWeekBest = { weightKg: w, reps: r };
          }
        }
      }

      const rx = e.prescription;
      const recommendKg = recommendWeightKg(
        {
          exerciseKey: e.exerciseKey ?? key,
          prescriptionWeight: rx.weight as string | number | undefined,
          prescriptionReps: typeof rx.reps === "number" ? rx.reps : null,
          lastWeekBest,
          oneRmKg: settings.oneRmKg[e.exerciseKey ?? ""] ?? null,
        },
        settings,
      );

      recommendations.push({
        plannedEntryId: e.id,
        exerciseKey: e.exerciseKey,
        label: e.label,
        recommendKg,
      });
    }
  }

  return NextResponse.json({ ok: true, date, recommendations });
}
