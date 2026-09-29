"use client";

import { TodayLogForm } from "@/components/today/today-log-form";
import { TodayPlanView } from "@/components/today/today-plan-view";
import type { PlanDayView } from "@/lib/plan/types";
import { todayKstDate } from "@/lib/dates/dayBounds";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function TodayContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const date = dateParam?.match(/^\d{4}-\d{2}-\d{2}$/) ? dateParam : todayKstDate();

  const [day, setDay] = useState<PlanDayView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logKey, setLogKey] = useState(0);
  const [recommendations, setRecommendations] = useState<
    { plannedEntryId: string; recommendKg: number | null }[]
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/plan/day?date=${encodeURIComponent(date)}`);
      const data = (await res.json()) as { ok?: boolean; day?: PlanDayView | null; error?: string };
      if (res.status === 401) {
        setError("로그인이 필요합니다.");
        return;
      }
      if (!data.ok) {
        setError(data.error ?? "불러오기 실패");
        return;
      }
      setDay(data.day ?? null);
      const recRes = await fetch(`/api/recommend/today?date=${encodeURIComponent(date)}`);
      const recData = (await recRes.json()) as {
        recommendations?: { plannedEntryId: string; recommendKg: number | null }[];
      };
      setRecommendations(recData.recommendations ?? []);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">오늘</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">{date} (KST)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={date}
            onChange={(e) => {
              if (e.target.value) window.location.href = `/today?date=${e.target.value}`;
            }}
          />
          <Link href="/week" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            주간 보기
          </Link>
        </div>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">불러오는 중…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && !day ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">이 날짜에 저장된 플랜이 없습니다.</p>
          <Link href="/plan/import" className={cn(buttonVariants(), "mt-4 inline-flex")}>
            플랜 가져오기
          </Link>
        </div>
      ) : null}

      {day ? (
        <Tabs defaultValue="plan">
          <TabsList>
            <TabsTrigger value="plan">플랜</TabsTrigger>
            <TabsTrigger value="log">기록</TabsTrigger>
          </TabsList>
          <TabsContent value="plan" className="mt-4">
            <TodayPlanView day={day} recommendations={recommendations} />
          </TabsContent>
          <TabsContent value="log" className="mt-4">
            <TodayLogForm
              key={`${day.id}-${date}-${logKey}`}
              day={day}
              date={date}
              onSaved={() => setLogKey((k) => k + 1)}
            />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">…</p>}>
      <TodayContent />
    </Suspense>
  );
}
