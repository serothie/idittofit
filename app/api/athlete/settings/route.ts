import { ensureAthlete } from "@/lib/athlete";
import { athleteSettingsSchema, mergeSettings } from "@/lib/athlete/settings";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const athleteId = await ensureAthlete(supabase, user.id);
  const { data } = await supabase.from("athletes").select("settings").eq("id", athleteId).single();
  return NextResponse.json({ ok: true, settings: mergeSettings(data?.settings) });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = athleteSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "설정 형식 오류" }, { status: 422 });
  }

  const athleteId = await ensureAthlete(supabase, user.id);
  const { error } = await supabase
    .from("athletes")
    .update({ settings: parsed.data })
    .eq("id", athleteId);

  if (error) return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  return NextResponse.json({ ok: true, settings: parsed.data });
}
