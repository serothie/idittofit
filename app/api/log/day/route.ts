import { kstDayBoundsUtcIso, parsePlanDate } from "@/lib/dates/dayBounds";
import { ensureAthlete } from "@/lib/athlete";
import type { LogSetInput } from "@/lib/plan/types";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const logItemSchema = z.object({
  plannedEntryId: z.string().uuid().optional(),
  planPartId: z.string().uuid().optional(),
  exerciseKey: z.string().optional(),
  label: z.string().optional(),
  reps: z.number().int().nullable().optional(),
  weight: z.number().nullable().optional(),
  weightUnit: z.string().nullable().optional(),
  rawLine: z.string().nullable().optional(),
  wodScore: z.string().nullable().optional(),
});

const postBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(logItemSchema).min(1),
});

async function exerciseIdByKey(
  supabase: Awaited<ReturnType<typeof createClient>>,
  key: string | undefined,
) {
  if (!key) return null;
  const { data } = await supabase.from("exercises").select("id").eq("key", key).maybeSingle();
  return data?.id ?? null;
}

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
  const { start, end } = kstDayBoundsUtcIso(date);

  const { data: rows, error } = await supabase
    .from("logged_sets")
    .select("id, reps, weight, weight_unit, raw_line, exercise_id")
    .eq("athlete_id", athleteId)
    .gte("performed_at", start)
    .lte("performed_at", end)
    .order("performed_at");

  if (error) {
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  const exerciseIds = [...new Set((rows ?? []).map((r) => r.exercise_id).filter(Boolean))];
  const keyById = new Map<string, string>();
  if (exerciseIds.length) {
    const { data: exRows } = await supabase.from("exercises").select("id, key").in("id", exerciseIds);
    for (const ex of exRows ?? []) keyById.set(ex.id, ex.key);
  }

  const logs = (rows ?? []).map((r) => ({
    id: r.id,
    reps: r.reps,
    weight: r.weight,
    weightUnit: r.weight_unit,
    rawLine: r.raw_line,
    exerciseKey: r.exercise_id ? keyById.get(r.exercise_id) : undefined,
  }));

  return NextResponse.json({ ok: true, date, logs });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력 형식 오류" }, { status: 422 });
  }

  const { date, items } = parsed.data;
  const athleteId = await ensureAthlete(supabase, user.id);
  const { start, end } = kstDayBoundsUtcIso(date);
  const performedAt = `${date}T12:00:00+09:00`;

  const { error: delError } = await supabase
    .from("logged_sets")
    .delete()
    .eq("athlete_id", athleteId)
    .gte("performed_at", start)
    .lte("performed_at", end);

  if (delError) {
    return NextResponse.json({ error: "기존 기록 삭제 실패" }, { status: 500 });
  }

  for (const item of items as LogSetInput[]) {
    const hasStrength =
      item.reps != null || item.weight != null || (item.exerciseKey && item.label);
    const wodLine = item.wodScore?.trim() || item.rawLine?.trim();
    if (!hasStrength && !wodLine) continue;

    const exerciseId = await exerciseIdByKey(supabase, item.exerciseKey);
    const rawLine =
      wodLine ||
      [item.label, item.reps != null ? `${item.reps} reps` : null, item.weight != null ? `${item.weight}${item.weightUnit ?? "kg"}` : null]
        .filter(Boolean)
        .join(" · ") ||
      null;

    const { error: insError } = await supabase.from("logged_sets").insert({
      athlete_id: athleteId,
      exercise_id: exerciseId,
      performed_at: performedAt,
      reps: item.reps ?? null,
      weight: item.weight ?? null,
      weight_unit: item.weightUnit ?? (item.weight != null ? "kg" : null),
      weight_kg: item.weight ?? null,
      raw_line: rawLine,
      source: "today_ui",
    });

    if (insError) {
      console.error("[log/day]", insError.message);
      return NextResponse.json({ error: "저장 실패" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
