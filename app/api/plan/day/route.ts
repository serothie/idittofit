import { parsePlanDate } from "@/lib/dates/dayBounds";
import { ensureAthlete } from "@/lib/athlete";
import { loadPlanDayForAthlete } from "@/lib/plan/loadPlanDay";
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

  const date = parsePlanDate(new URL(request.url).searchParams.get("date"));
  if (!date) {
    return NextResponse.json({ error: "date=YYYY-MM-DD 필요" }, { status: 400 });
  }

  const athleteId = await ensureAthlete(supabase, user.id);
  const day = await loadPlanDayForAthlete(supabase, athleteId, date);

  return NextResponse.json({ ok: true, date, day });
}
