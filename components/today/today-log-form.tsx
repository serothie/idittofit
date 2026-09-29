"use client";

import type { LogSetInput, PlanDayView } from "@/lib/plan/types";
import { rxNumber, rxString } from "@/lib/plan/prescriptionDefaults";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

function buildInitialItems(day: PlanDayView): LogSetInput[] {
  const items: LogSetInput[] = [];
  for (const part of day.parts) {
    const isWod =
      part.entries.length === 0 &&
      (part.partType.toLowerCase().includes("wod") || Boolean(part.rawText));
    if (isWod && (part.rawText || part.scoreText)) {
      items.push({
        planPartId: part.id,
        rawLine: part.rawText,
        wodScore: part.scoreText ?? "",
      });
      continue;
    }
    for (const e of part.entries) {
      const rx = e.prescription;
      items.push({
        plannedEntryId: e.id,
        planPartId: part.id,
        exerciseKey: e.exerciseKey,
        label: e.label,
        reps: rxNumber(rx.reps),
        weight: rxNumber(rx.weight),
        weightUnit: rxString(rx.weightUnit) || "kg",
      });
    }
  }
  return items;
}

export function TodayLogForm({
  day,
  date,
  onSaved,
}: {
  day: PlanDayView;
  date: string;
  onSaved: () => void;
}) {
  const initial = useMemo(() => buildInitialItems(day), [day]);
  const [items, setItems] = useState<LogSetInput[]>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(initial);
    void (async () => {
      const res = await fetch(`/api/log/day?date=${encodeURIComponent(date)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        logs?: { exerciseKey?: string; reps: number | null; weight: number | null; rawLine: string | null }[];
      };
      const logs = data.logs ?? [];
      if (!logs.length) return;
      setItems((prev) =>
        prev.map((item) => {
          const match = logs.find(
            (l) =>
              (item.exerciseKey && l.exerciseKey === item.exerciseKey) ||
              (item.label && l.rawLine?.includes(item.label)),
          );
          if (!match) return item;
          if (item.wodScore !== undefined && match.rawLine) {
            return { ...item, wodScore: match.rawLine };
          }
          return {
            ...item,
            reps: match.reps ?? item.reps,
            weight: match.weight ?? item.weight,
          };
        }),
      );
    })();
  }, [date, initial]);

  function updateItem(index: number, patch: Partial<LogSetInput>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/log/day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, items }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? "저장 실패");
        return;
      }
      setMessage("기록을 저장했습니다.");
      onSaved();
    } catch {
      setMessage("네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        기록할 종목이 없습니다. WOD만 있는 날은 플랜 import에서 파트를 확인하세요.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isWod = item.wodScore !== undefined || (item.planPartId && !item.plannedEntryId && item.rawLine);
        if (isWod && !item.plannedEntryId) {
          return (
            <Card key={`wod-${item.planPartId}-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">WOD 기록</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.rawLine ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">{item.rawLine}</p>
                ) : null}
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">점수 / 시간 / rounds</span>
                  <Input
                    value={item.wodScore ?? ""}
                    onChange={(e) => updateItem(index, { wodScore: e.target.value })}
                    placeholder="예: 12:34, 8+12"
                  />
                </label>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={item.plannedEntryId ?? index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.label || item.exerciseKey || "종목"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">횟수</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={item.reps ?? ""}
                  onChange={(e) =>
                    updateItem(index, {
                      reps: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">무게</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={item.weight ?? ""}
                  onChange={(e) =>
                    updateItem(index, {
                      weight: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">단위</span>
                <Input
                  value={item.weightUnit ?? "kg"}
                  onChange={(e) => updateItem(index, { weightUnit: e.target.value })}
                />
              </label>
            </CardContent>
          </Card>
        );
      })}

      <Button type="button" disabled={saving} onClick={() => void save()}>
        {saving ? "저장 중…" : "기록 저장"}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
