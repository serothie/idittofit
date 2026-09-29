"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

type RuleOk = {
  ok: true;
  label: string;
  exerciseKey?: string;
  reps?: number;
  weight?: number;
};

export default function MemoPage() {
  const [text, setText] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [rule, setRule] = useState<RuleOk[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [ai, setAi] = useState<RuleOk[]>([]);
  const [loading, setLoading] = useState(false);

  async function parse() {
    setLoading(true);
    setRule([]);
    setFailed([]);
    setAi([]);
    const res = await fetch("/api/memo/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, useAi }),
    });
    const data = (await res.json()) as {
      rule?: RuleOk[];
      failed?: string[];
      ai?: RuleOk[];
      error?: string;
    };
    setLoading(false);
    if (!res.ok) {
      setFailed([data.error ?? "오류"]);
      return;
    }
    setRule(data.rule ?? []);
    setFailed(data.failed ?? []);
    setAi((data.ai ?? []) as RuleOk[]);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">메모 파싱</h1>
        <p className="text-sm text-muted-foreground">규칙 파서 우선 · 실패 줄만 AI</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
            실패 줄 AI 해석
          </label>
          <Button type="button" disabled={loading || !text.trim()} onClick={() => void parse()}>
            {loading ? "분석 중…" : "미리보기"}
          </Button>
        </CardContent>
      </Card>

      {rule.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>규칙 성공 ({rule.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            {rule.map((r, i) => (
              <div key={i} className="rounded bg-muted/50 p-2">
                {r.label} · {r.exerciseKey ?? "?"} · {r.reps ?? "-"} reps · {r.weight ?? "-"} kg
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {failed.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>규칙 실패 ({failed.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {failed.map((l) => (
              <div key={l}>{l}</div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {ai.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>AI 보완 ({ai.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm font-mono">
            {ai.map((r, i) => (
              <div key={i} className="rounded border border-primary/20 p-2">
                {r.label} · {r.exerciseKey ?? "?"} · {r.reps ?? "-"} · {r.weight ?? "-"}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
