import { parseMemoLinesWithAi } from "@/lib/ai/parseMemo";
import { parseMemoText } from "@/lib/parser/parseMemoLine";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  text: z.string(),
  useAi: z.boolean().optional(),
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

  const ruleResults = parseMemoText(parsed.data.text);
  const ok = ruleResults.filter((r) => r.ok);
  const failed = ruleResults.filter((r) => !r.ok);

  let aiParsed: Awaited<ReturnType<typeof parseMemoLinesWithAi>> = [];
  if (parsed.data.useAi && failed.length) {
    try {
      aiParsed = await parseMemoLinesWithAi(failed.map((f) => f.rawLine));
    } catch (e) {
      const message = e instanceof Error ? e.message : "AI parse failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    rule: ok,
    failed: failed.map((f) => f.rawLine),
    ai: aiParsed,
  });
}
