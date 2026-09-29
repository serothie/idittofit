"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useState } from "react";

export default function PlanImportPage() {
  const [sourceText, setSourceText] = useState("");
  const [resultJson, setResultJson] = useState("");
  const [aiJson, setAiJson] = useState<unknown>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState<"parse" | "save" | null>(null);

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
      if (!res.ok || !data.ok || !data.result) {
        setStatus(data.error ?? `파싱 실패 (${res.status})`);
        return;
      }
      setAiJson(data.result);
      setResultJson(JSON.stringify(data.result, null, 2));
      setStatus("파싱 완료. 아래 JSON을 수정한 뒤 저장하세요.");
    } catch {
      setStatus("네트워크 오류");
    } finally {
      setLoading(null);
    }
  }

  async function handleSave() {
    setLoading("save");
    setStatus(null);
    try {
      const final = JSON.parse(resultJson) as unknown;
      const res = await fetch("/api/plan/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText, aiJson, final }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? `저장 실패 (${res.status})`);
        return;
      }
      setStatus("저장되었습니다.");
    } catch {
      setStatus("JSON 형식 또는 네트워크 오류");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">플랜 가져오기</h1>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          홈
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. 플랜 TXT</CardTitle>
          <CardDescription>코치 플랜 원문을 붙여넣습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={12}
            placeholder="월요일 ...&#10;화요일 ..."
            className="font-mono text-sm"
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

      <Card>
        <CardHeader>
          <CardTitle>2. 확인 · 수정</CardTitle>
          <CardDescription>JSON을 고친 뒤 저장합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={resultJson}
            onChange={(e) => setResultJson(e.target.value)}
            rows={16}
            className="font-mono text-sm"
            placeholder="파싱 후 JSON이 여기 표시됩니다"
          />
          <Button
            type="button"
            variant="secondary"
            disabled={!resultJson.trim() || loading !== null}
            onClick={() => void handleSave()}
          >
            {loading === "save" ? "저장 중…" : "DB에 저장"}
          </Button>
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </main>
  );
}
