import { kstDayBoundsUtcIso, parsePlanDate, weekMonSat } from "@/lib/dates/dayBounds";
import { ensureAthlete } from "@/lib/athlete";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anchor =
    parsePlanDate(new URL(request.url).searchParams.get("date")) ??
    parsePlanDate(new URL(request.url).searchParams.get("anchor"));
  if (!anchor) {
    return NextResponse.json({ error: "date=YYYY-MM-DD 필요" }, { status: 400 });
  }

  const athleteId = await ensureAthlete(supabase, user.id);
  const dates = weekMonSat(anchor);

  const { data: planRows } = await supabase
    .from("plan_days")
    .select("plan_date, week_label")
    .eq("athlete_id", athleteId)
    .in("plan_date", dates);

  const planByDate = new Map(
    (planRows ?? []).map((r) => [r.plan_date as string, r.week_label as string | null]),
  );

  const days = [];
  for (const planDate of dates) {
    const { start, end } = kstDayBoundsUtcIso(planDate);
    const { count } = await supabase
      .from("logged_sets")
      .select("id", { count: "exact", head: true })
      .eq("athlete_id", athleteId)
      .gte("performed_at", start)
      .lte("performed_at", end);

    days.push({
      planDate,
      hasPlan: planByDate.has(planDate),
      weekLabel: planByDate.get(planDate) ?? undefined,
      hasLog: (count ?? 0) > 0,
    });
  }

  return NextResponse.json({ ok: true, anchor, dates, days });
}
