"use client";

import { WeekGrid, type WeekDaySummary } from "@/components/week/week-grid";
import { todayKstDate, weekMonSat } from "@/lib/dates/dayBounds";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T12:00:00+09:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function WeekContent() {
  const searchParams = useSearchParams();
  const anchorParam = searchParams.get("date");
  const anchor =
    anchorParam?.match(/^\d{4}-\d{2}-\d{2}$/) ? anchorParam : todayKstDate();

  const [days, setDays] = useState<WeekDaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  const rangeLabel = useMemo(() => {
    const w = weekMonSat(anchor);
    return `${w[0]} ~ ${w[5]}`;
  }, [anchor]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/plan/week?date=${encodeURIComponent(anchor)}`);
      const data = (await res.json()) as { ok?: boolean; days?: WeekDaySummary[] };
      setDays(data.days ?? []);
      setLoading(false);
    })();
  }, [anchor]);

  const prevWeek = addDays(anchor, -7);
  const nextWeek = addDays(anchor, 7);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">주간</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">월 ~ 토 · {rangeLabel}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/week?date=${prevWeek}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            이전 주
          </Link>
          <Link href={`/week?date=${nextWeek}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            다음 주
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full bg-amber-500" /> 플랜만
        </span>
        <span className="mx-2">·</span>
        <span>✓ 기록 완료</span>
        <span className="mx-2">·</span>
        날짜를 누르면 오늘 화면으로 이동합니다.
      </p>

      {loading ? <p className="text-sm text-muted-foreground">불러오는 중…</p> : null}
      {!loading ? <WeekGrid days={days} selectedDate={todayKstDate()} /> : null}
    </div>
  );
}

export default function WeekPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">…</p>}>
      <WeekContent />
    </Suspense>
  );
}
