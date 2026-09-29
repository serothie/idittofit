import { planParseResultSchema } from "@/lib/ai/schemas/planParse";
import { ensureAthlete } from "@/lib/athlete";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sourceText?: string; aiJson?: unknown; final?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = planParseResultSchema.safeParse(body.final);
  if (!parsed.success) {
    return NextResponse.json({ error: "final JSON 형식이 올바르지 않습니다" }, { status: 422 });
  }

  const athleteId = await ensureAthlete(supabase, user.id);
  const sourceText = body.sourceText ?? "";
  const inputHash = createHash("sha256").update(sourceText).digest("hex");

  const { error: prError } = await supabase.from("parse_results").insert({
    athlete_id: athleteId,
    source_type: "plan_txt",
    input_hash: inputHash,
    ai_json: body.aiJson ?? null,
    final_json: parsed.data,
    model: process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
    parser_version: "1",
  });
  if (prError) {
    console.error("[plan/save] parse_results", prError.message);
    return NextResponse.json({ error: "저장에 실패했습니다" }, { status: 500 });
  }

  for (const day of parsed.data.days) {
    const { data: planDay, error: dayError } = await supabase
      .from("plan_days")
      .upsert(
        {
          athlete_id: athleteId,
          plan_date: day.planDate,
          week_label: day.weekLabel ?? null,
          source_text: sourceText || null,
        },
        { onConflict: "athlete_id,plan_date" },
      )
      .select("id")
      .single();

    if (dayError || !planDay) {
      console.error("[plan/save] plan_days", dayError?.message);
      return NextResponse.json({ error: "요일 저장 실패" }, { status: 500 });
    }

    let sort = 0;
    for (const part of day.parts) {
      const { data: planPart, error: partError } = await supabase
        .from("plan_parts")
        .insert({
          plan_day_id: planDay.id,
          part_type: part.partType,
          sort_order: sort++,
          raw_text: part.rawText ?? null,
          score_text: part.scoreText ?? null,
        })
        .select("id")
        .single();

      if (partError || !planPart) continue;

      let entrySort = 0;
      for (const entry of part.entries) {
        await supabase.from("planned_entries").insert({
          plan_part_id: planPart.id,
          sort_order: entrySort++,
          prescription: {
            ...(entry.prescription ?? {}),
            exerciseKey: entry.exerciseKey,
            label: entry.label,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
