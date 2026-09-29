"use client";

import Link from "next/link";
import { cn } from "cn";
import { Check } from "lucide-react";

const WEEKDAY = ["월", "화", "수", "목", "금", "토"] as const;

export type WeekDaySummary = {
  planDate: string;
  hasPlan: boolean;
  hasLog: boolean;
  weekLabel?: string;
};

export function WeekGrid({ days, selectedDate }: { days: WeekDaySummary[]; selectedDate?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {days.map((d, i) => {
        const selected = selectedDate === d.planDate;
        return (
          <Link
            key={d.planDate}
            href={`/today?date=${d.planDate}`}
            className={cn(
              "flex min-h-[100px] flex-col rounded-xl border border-border p-4 transition-colors hover:bg-muted/50",
              selected && "border-primary ring-2 ring-primary/20",
              !d.hasPlan && "opacity-70",
            )}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{WEEKDAY[i]}</span>
              {d.hasLog ? (
                <span className="flex items-center gap-0.5 text-primary">
                  <Check className="size-3.5" aria-hidden />
                  기록
                </span>
              ) : d.hasPlan ? (
                <span className="size-2 rounded-full bg-amber-500" title="플랜만 있음" />
              ) : null}
            </div>
            <span className="mt-2 text-lg font-semibold tabular-nums">{d.planDate.slice(8)}</span>
            <span className="mt-1 text-xs text-muted-foreground">{d.planDate.slice(0, 7)}</span>
            {d.weekLabel ? (
              <span className="mt-auto pt-2 truncate text-xs text-muted-foreground">{d.weekLabel}</span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
