import { ensureAthlete } from "@/lib/athlete";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const exerciseKey = new URL(request.url).searchParams.get("exerciseKey");
  if (!exerciseKey) {
    return NextResponse.json({ error: "exerciseKey 필요" }, { status: 400 });
  }

  const athleteId = await ensureAthlete(supabase, user.id);
  const { data: ex } = await supabase.from("exercises").select("id").eq("key", exerciseKey).maybeSingle();
  if (!ex) return NextResponse.json({ ok: true, points: [] });

  const { data: rows } = await supabase
    .from("logged_sets")
    .select("performed_at, weight_kg, weight, reps")
    .eq("athlete_id", athleteId)
    .eq("exercise_id", ex.id)
    .order("performed_at");

  const byDate = new Map<string, number>();
  for (const r of rows ?? []) {
    const d = (r.performed_at as string).slice(0, 10);
    const w = Number(r.weight_kg ?? r.weight ?? 0);
    if (w <= 0) continue;
    byDate.set(d, Math.max(byDate.get(d) ?? 0, w));
  }

  const points = [...byDate.entries()].map(([date, maxKg]) => ({ date, maxKg }));
  return NextResponse.json({ ok: true, exerciseKey, points });
}
