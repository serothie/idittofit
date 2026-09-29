"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ExerciseChart({ points }: { points: { date: string; maxKg: number }[] }) {
  if (!points.length) {
    return <p className="text-sm text-muted-foreground">표시할 기록이 없습니다.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="kg" />
          <Tooltip />
          <Line type="monotone" dataKey="maxKg" stroke="hsl(var(--primary))" dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
