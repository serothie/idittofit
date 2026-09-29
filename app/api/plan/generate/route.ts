import { generatePlan } from "@/lib/ai/generatePlan";
import {
  assertGeneratePlanQuota,
  recordGeneratePlanUsage,
} from "@/lib/ai/usage";
import { ensureAthlete } from "@/lib/athlete";
import { buildGenerateContext } from "@/lib/plan/buildGenerateContext";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  feedback: z.string().optional(),
  extraContext: z.string().optional(),
});

export async function POST(request: Request) {
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력 오류" }, { status: 422 });
  }

  try {
    await assertGeneratePlanQuota(supabase, user.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : "quota";
    return NextResponse.json({ error: message }, { status: 429 });
  }

  const athleteId = await ensureAthlete(supabase, user.id);
  const context = await buildGenerateContext(supabase, athleteId);
  const fullContext = [context, parsed.data.extraContext].filter(Boolean).join("\n\n");

  try {
    const result = await generatePlan({
      context: fullContext,
      feedback: parsed.data.feedback,
    });
    await recordGeneratePlanUsage(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "generate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
