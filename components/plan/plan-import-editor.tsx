"use client";

import type { PlanParseResult } from "@/lib/ai/schemas/planParse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const RX_FIELDS = ["sets", "reps", "weight", "tempo", "rest"] as const;

type ExerciseOption = { id: string; key: string; measurement_kind: string };

function rxString(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function setRx(
  prescription: Record<string, unknown>,
  key: string,
  raw: string,
): Record<string, unknown> {
  const next = { ...prescription };
  if (!raw.trim()) {
    delete next[key];
    return next;
  }
  const num = Number(raw);
  next[key] = Number.isFinite(num) && raw.trim() !== "" && !/[a-z%]/i.test(raw) ? num : raw;
  return next;
}

export function PlanImportEditor({
  value,
  onChange,
  exercises,
}: {
  value: PlanParseResult;
  onChange: (next: PlanParseResult) => void;
  exercises: ExerciseOption[];
}) {
  function updateDay(di: number, patch: Partial<PlanParseResult["days"][0]>) {
    const days = value.days.map((d, i) => (i === di ? { ...d, ...patch } : d));
    onChange({ ...value, days });
  }

  function updatePart(di: number, pi: number, patch: Partial<PlanParseResult["days"][0]["parts"][0]>) {
    const days = value.days.map((d, i) => {
      if (i !== di) return d;
      const parts = d.parts.map((p, j) => (j === pi ? { ...p, ...patch } : p));
      return { ...d, parts };
    });
    onChange({ ...value, days });
  }

  function updateEntry(
    di: number,
    pi: number,
    ei: number,
    patch: Partial<PlanParseResult["days"][0]["parts"][0]["entries"][0]>,
  ) {
    const days = value.days.map((d, i) => {
      if (i !== di) return d;
      const parts = d.parts.map((p, j) => {
        if (j !== pi) return p;
        const entries = p.entries.map((e, k) => (k === ei ? { ...e, ...patch } : e));
        return { ...p, entries };
      });
      return { ...d, parts };
    });
    onChange({ ...value, days });
  }

  function addPart(di: number) {
    const days = value.days.map((d, i) =>
      i === di ? { ...d, parts: [...d.parts, { partType: "block", entries: [] }] } : d,
    );
    onChange({ ...value, days });
  }

  function removePart(di: number, pi: number) {
    const days = value.days.map((d, i) =>
      i === di ? { ...d, parts: d.parts.filter((_, j) => j !== pi) } : d,
    );
    onChange({ ...value, days });
  }

  function addEntry(di: number, pi: number) {
    const days = value.days.map((d, i) => {
      if (i !== di) return d;
      const parts = d.parts.map((p, j) =>
        j === pi ? { ...p, entries: [...p.entries, { prescription: {} }] } : p,
      );
      return { ...d, parts };
    });
    onChange({ ...value, days });
  }

  function removeEntry(di: number, pi: number, ei: number) {
    const days = value.days.map((d, i) => {
      if (i !== di) return d;
      const parts = d.parts.map((p, j) =>
        j === pi ? { ...p, entries: p.entries.filter((_, k) => k !== ei) } : p,
      );
      return { ...d, parts };
    });
    onChange({ ...value, days });
  }

  const defaultTab = value.days[0]?.planDate ?? "day-0";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">요일 {value.days.length}개</span>
        {value.notes ? <Badge variant="secondary">메모: {value.notes}</Badge> : null}
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {value.days.map((day) => (
            <TabsTrigger key={day.planDate} value={day.planDate} className="shrink-0">
              {day.planDate.slice(5)}
            </TabsTrigger>
          ))}
        </TabsList>

        {value.days.map((day, di) => (
          <TabsContent key={day.planDate} value={day.planDate} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5 text-sm">
                <span className="font-medium text-muted-foreground">날짜</span>
                <Input
                  type="date"
                  value={day.planDate}
                  onChange={(e) => updateDay(di, { planDate: e.target.value })}
                />
              </label>
              <label className="space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium text-muted-foreground">주차 라벨</span>
                <Input
                  value={day.weekLabel ?? ""}
                  placeholder="load-1, deload …"
                  onChange={(e) => updateDay(di, { weekLabel: e.target.value || undefined })}
                />
              </label>
            </div>

            {day.parts.length === 0 ? (
              <p className="text-sm text-muted-foreground">파트가 없습니다. WOD만 있으면 파트를 추가하세요.</p>
            ) : null}

            {day.parts.map((part, pi) => (
              <Card key={pi}>
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
                  <CardTitle className="text-base">파트 {pi + 1}</CardTitle>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removePart(di, pi)}>
                    삭제
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium text-muted-foreground">유형</span>
                      <Input
                        value={part.partType}
                        placeholder="strength, wod, skill …"
                        onChange={(e) => updatePart(di, pi, { partType: e.target.value })}
                      />
                    </label>
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium text-muted-foreground">점수/캡</span>
                      <Input
                        value={part.scoreText ?? ""}
                        onChange={(e) => updatePart(di, pi, { scoreText: e.target.value || undefined })}
                      />
                    </label>
                  </div>
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium text-muted-foreground">원문 (WOD 등)</span>
                    <Textarea
                      rows={3}
                      value={part.rawText ?? ""}
                      className="text-sm"
                      onChange={(e) => updatePart(di, pi, { rawText: e.target.value || undefined })}
                    />
                  </label>

                  {part.entries.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full min-w-[640px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/50 text-left text-xs text-muted-foreground">
                            <th className="px-3 py-2 font-medium">종목</th>
                            <th className="px-3 py-2 font-medium">표기</th>
                            {RX_FIELDS.map((f) => (
                              <th key={f} className="px-3 py-2 font-medium">
                                {f}
                              </th>
                            ))}
                            <th className="px-3 py-2 w-16" />
                          </tr>
                        </thead>
                        <tbody>
                          {part.entries.map((entry, ei) => {
                            const rx = (entry.prescription ?? {}) as Record<string, unknown>;
                            return (
                              <tr key={ei} className="border-b border-border last:border-0">
                                <td className="px-2 py-2 align-top">
                                  <select
                                    className="h-8 w-full max-w-[140px] rounded-lg border border-input bg-transparent px-2 text-sm"
                                    value={entry.exerciseKey ?? ""}
                                    onChange={(e) =>
                                      updateEntry(di, pi, ei, {
                                        exerciseKey: e.target.value || undefined,
                                      })
                                    }
                                  >
                                    <option value="">—</option>
                                    {exercises.map((ex) => (
                                      <option key={ex.id} value={ex.key}>
                                        {ex.key}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-2 align-top">
                                  <Input
                                    className="min-w-[100px]"
                                    value={entry.label ?? ""}
                                    placeholder="FS, DL …"
                                    onChange={(e) =>
                                      updateEntry(di, pi, ei, {
                                        label: e.target.value || undefined,
                                      })
                                    }
                                  />
                                </td>
                                {RX_FIELDS.map((field) => (
                                  <td key={field} className="px-2 py-2 align-top">
                                    <Input
                                      className="min-w-[72px]"
                                      value={rxString(rx[field])}
                                      onChange={(e) =>
                                        updateEntry(di, pi, ei, {
                                          prescription: setRx(rx, field, e.target.value),
                                        })
                                      }
                                    />
                                  </td>
                                ))}
                                <td className="px-2 py-2 align-top">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeEntry(di, pi, ei)}
                                  >
                                    ×
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : null}

                  <Button type="button" variant="outline" size="sm" onClick={() => addEntry(di, pi)}>
                    종목 행 추가
                  </Button>
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={() => addPart(di)}>
              파트 추가
            </Button>
          </TabsContent>
        ))}
      </Tabs>

      <label className="block space-y-1.5 text-sm">
        <span className="font-medium text-muted-foreground">플랜 메모</span>
        <Input
          value={value.notes ?? ""}
          onChange={(e) => onChange({ ...value, notes: e.target.value || undefined })}
        />
      </label>
    </div>
  );
}
