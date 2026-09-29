import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("id, key, measurement_kind")
    .order("key");

  if (error) {
    return NextResponse.json({ error: "목록을 불러오지 못했습니다" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, exercises: data ?? [] });
}
