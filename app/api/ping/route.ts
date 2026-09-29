import { GoogleGenAI } from "@google/genai";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** 무료 티어 경량 모델. 2.5-flash-lite는 신규 키에서 404 → flash-lite-latest 또는 3.x lite */
const PING_MODEL = process.env.GEMINI_PING_MODEL ?? "gemini-flash-lite-latest";
const PING_PROMPT = "한 문장으로 '연결됨'이라고만 답해.";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/** Gemini 서버 연결 확인 (Bearer PING_TOKEN 필요) */
export async function GET(request: NextRequest) {
  const pingToken = process.env.PING_TOKEN;
  const provided = bearerToken(request);
  if (!pingToken || !provided || provided !== pingToken) {
    return unauthorized();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "서버에 Gemini 키가 설정되지 않았습니다" },
      { status: 500 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: PING_MODEL,
      contents: PING_PROMPT,
    });
    const reply = response.text?.trim() ?? "";
    return NextResponse.json({ ok: true, prompt: PING_PROMPT, reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[ping] gemini 호출 실패:", message);
    return NextResponse.json({ ok: false, error: "Gemini 호출 실패" }, { status: 500 });
  }
}
