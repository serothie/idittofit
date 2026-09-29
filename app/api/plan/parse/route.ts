import { parsePlan } from "@/lib/ai/parsePlan";
import { assertParsePlanQuota, recordParsePlanUsage } from "@/lib/ai/usage";
import { ensureAthlete } from "@/lib/athlete";
import { createClient } from "@/lib/supabase/server";
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

  let body: { text?: string };
  try {
    body = (await request.json()) as { text?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "text가 필요합니다" }, { status: 400 });
  }

  try {
    await assertParsePlanQuota(supabase, user.id);
    await ensureAthlete(supabase, user.id);
    const result = await parsePlan(text);
    await recordParsePlanUsage(supabase, user.id);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "parse failed";
    if (message.includes("한도")) {
      return NextResponse.json({ ok: false, error: message }, { status: 429 });
    }
    console.error("[plan/parse]", message);
    return NextResponse.json({ ok: false, error: "플랜 파싱에 실패했습니다" }, { status: 500 });
  }
}
