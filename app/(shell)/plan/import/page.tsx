"use client";

import { PlanImportEditor } from "@/components/plan/plan-import-editor";
import { planParseResultSchema, type PlanParseResult } from "@/lib/ai/schemas/planParse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

type ExerciseOption = { id: string; key: string; measurement_kind: string };

export default function PlanImportPage() {
  const [sourceText, setSourceText] = useState("");
  const [draft, setDraft] = useState<PlanParseResult | null>(null);
  const [aiJson, setAiJson] = useState<unknown>(null);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<"parse" | "save" | null>(null);

  useEffect(() => {
    const draftText = sessionStorage.getItem("planImportDraft");
    if (draftText) {
      setSourceText(draftText);
      sessionStorage.removeItem("planImportDraft");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/exercises");
      if (!res.ok) return;
      const data = (await res.json()) as { exercises?: ExerciseOption[] };
      setExercises(data.exercises ?? []);
    })();
  }, []);

  async function handleParse() {
    setLoading("parse");
    setStatus(null);
    try {
      const res = await fetch("/api/plan/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const data = (await res.json()) as { ok?: boolean; result?: unknown; error?: string };
      if (res.status === 401) {
        setStatus("로그인이 필요합니다.");
        return;
      }
      if (!res.ok || !data.ok || !data.result) {
        setStatus(data.error ?? `파싱 실패 (${res.status})`);
        return;
      }
      const parsed = planParseResultSchema.safeParse(data.result);
      if (!parsed.success) {
        setStatus("AI 결과 형식이 올바르지 않습니다.");
        return;
      }
      setAiJson(data.result);
      setDraft(parsed.data);
      setStatus("파싱 완료. 아래에서 날짜·종목·처방을 확인한 뒤 저장하세요.");
    } catch {
      setStatus("네트워크 오류");
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setLoading("save");
    setStatus(null);
    const validated = planParseResultSchema.safeParse(draft);
    if (!validated.success) {
      setStatus("입력값을 확인해 주세요 (날짜 형식 등).");
      setLoading(null);
      return;
    }
    try {
      const res = await fetch("/api/plan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, aiJson, final: validated.data }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (res.status === 401) {
        setStatus("로그인이 필요합니다.");
        return;
      }
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? `저장 실패 (${res.status})`);
        return;
      }
      setStatus("저장되었습니다.");
    } catch {
      setStatus("네트워크 오류");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">플랜 가져오기</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          TXT 붙여넣기 → AI 분류 → 표에서 수정 → 저장 ·{" "}
          <a href="/plan/generate" className="text-primary underline-offset-2 hover:underline">
            AI 생성
          </a>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>1. 플랜 TXT</CardTitle>
            <CardDescription>코치 플랜 원문을 붙여넣습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={14}
              placeholder="월요일 …&#10;화요일 …"
              className="min-h-[280px] font-mono text-sm lg:min-h-[360px]"
            />
            <Button
              type="button"
              disabled={!sourceText.trim() || loading !== null}
              onClick={() => void handleParse()}
            >
              {loading === "parse" ? "AI 파싱 중…" : "AI로 파싱"}
            </Button>
          </CardContent>
        </Card>

        <Card className={draft ? "" : "opacity-60"}>
          <CardHeader>
            <CardTitle>2. 확인 · 수정</CardTitle>
            <CardDescription>요일 탭과 표에서 고친 뒤 저장합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {draft ? (
              <PlanImportEditor value={draft} onChange={setDraft} exercises={exercises} />
            ) : (
              <p className="text-sm text-muted-foreground">파싱 후 이 영역에 편집 UI가 표시됩니다.</p>
            )}
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={!draft || loading !== null}
              onClick={() => void handleSave()}
            >
              {loading === "save" ? "저장 중…" : "DB에 저장"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {status ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">{status}</p>
      ) : null}
    </div>
  );
}
