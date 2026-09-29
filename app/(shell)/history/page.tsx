"use client";

import { ExerciseChart } from "@/components/history/exercise-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

const KEYS = ["front_squat", "back_squat", "deadlift"];

export default function HistoryPage() {
  const [exerciseKey, setExerciseKey] = useState(KEYS[0]);
  const [points, setPoints] = useState<{ date: string; maxKg: number }[]>([]);

  useEffect(() => {
    void fetch(`/api/history?exerciseKey=${encodeURIComponent(exerciseKey)}`)
      .then((r) => r.json())
      .then((d: { points?: { date: string; maxKg: number }[] }) => setPoints(d.points ?? []));
  }, [exerciseKey]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold md:text-3xl">종목별 기록</h1>
      <div className="flex flex-wrap gap-2">
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              exerciseKey === k ? "border-primary bg-primary/10" : "border-border"
            }`}
            onClick={() => setExerciseKey(k)}
          >
            {k}
          </button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>최고 무게 추이</CardTitle>
        </CardHeader>
        <CardContent>
          <ExerciseChart points={points} />
        </CardContent>
      </Card>
    </div>
  );
}
