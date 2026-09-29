"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { cn } from "cn";
import { useState } from "react";

export default function PlanGeneratePage() {
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function generate(isRegenerate: boolean) {
    setLoading(true);
    setStatus(null);
    const res = await fetch("/api/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedback: isRegenerate ? feedback : undefined,
        extraContext: isRegenerate ? undefined : feedback || undefined,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; text?: string; error?: string };
    setLoading(false);
    if (!res.ok || !data.text) {
      setStatus(data.error ?? "생성 실패");
      return;
    }
    setText(data.text);
    setStatus("생성 완료. 복사하거나 import로 보내세요.");
  }

  function copy() {
    void navigator.clipboard.writeText(text);
    setStatus("클립보드에 복사했습니다.");
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">다음 주 플랜 생성</h1>
        <p className="text-sm text-muted-foreground">최근 저장 플랜을 참고해 AI가 TXT를 만듭니다.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>피드백 / 추가 지시 (선택)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="디로드 주, FS 비중 줄이기 …"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={loading} onClick={() => void generate(false)}>
              {loading ? "생성 중…" : "플랜 생성"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || !text}
              onClick={() => void generate(true)}
            >
              피드백 반영 재생성
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>결과 TXT</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!text} onClick={copy}>
              복사
            </Button>
            <Link
              href="/plan/import"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), !text && "pointer-events-none opacity-50")}
              onClick={() => {
                if (text) sessionStorage.setItem("planImportDraft", text);
              }}
            >
              import로
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea rows={16} className="font-mono text-sm" value={text} onChange={(e) => setText(e.target.value)} />
        </CardContent>
      </Card>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
