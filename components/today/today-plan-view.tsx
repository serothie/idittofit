"use client";

import type { PlanDayView } from "@/lib/plan/types";
import { rxString } from "@/lib/plan/prescriptionDefaults";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Rec = { plannedEntryId: string; recommendKg: number | null };

export function TodayPlanView({
  day,
  recommendations = [],
}: {
  day: PlanDayView;
  recommendations?: Rec[];
}) {
  const recByEntry = new Map(recommendations.map((r) => [r.plannedEntryId, r.recommendKg]));
  return (
    <div className="space-y-4">
      {day.weekLabel ? <Badge variant="secondary">{day.weekLabel}</Badge> : null}
      {day.parts.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 파트가 없습니다.</p>
      ) : null}
      {day.parts.map((part, i) => (
        <Card key={part.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {part.partType}
              {part.scoreText ? (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {part.scoreText}
                </span>
              ) : null}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {part.rawText ? (
              <pre className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 font-sans text-sm">
                {part.rawText}
              </pre>
            ) : null}
            {part.entries.length > 0 ? (
              <ul className="space-y-2">
                {part.entries.map((e) => {
                  const rx = e.prescription;
                  const title = e.label || e.exerciseKey || "종목";
                  const detail = ["sets", "reps", "weight", "tempo"]
                    .map((k) => {
                      const v = rxString(rx[k]);
                      return v ? `${k} ${v}` : null;
                    })
                    .filter(Boolean)
                    .join(" · ");
                  const rec = recByEntry.get(e.id);
                  return (
                    <li key={e.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/60 pb-2 last:border-0">
                      <span className="font-medium">{title}</span>
                      {detail ? <span className="text-muted-foreground">{detail}</span> : null}
                      {rec != null && rec > 0 ? (
                        <Badge variant="outline">추천 {rec} kg</Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
