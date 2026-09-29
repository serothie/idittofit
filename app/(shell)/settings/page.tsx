"use client";

import type { AthleteSettings } from "@/lib/athlete/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

const SEED_KEYS = ["front_squat", "back_squat", "deadlift"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AthleteSettings | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/athlete/settings")
      .then((r) => r.json())
      .then((d: { settings?: AthleteSettings }) => setSettings(d.settings ?? null));
  }, []);

  async function save() {
    if (!settings) return;
    setStatus(null);
    const res = await fetch("/api/athlete/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setStatus(res.ok ? "저장됨" : "저장 실패");
  }

  if (!settings) return <p className="text-sm text-muted-foreground">불러오는 중…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold md:text-3xl">설정</h1>

      <Card>
        <CardHeader>
          <CardTitle>추천 무게</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">플랜 무게 비율</span>
            <Input
              type="number"
              step="0.01"
              value={settings.planWeightRatio}
              onChange={(e) =>
                setSettings({ ...settings, planWeightRatio: Number(e.target.value) })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">최소 증량 (kg)</span>
            <Input
              type="number"
              step="0.5"
              value={settings.minIncrementKg}
              onChange={(e) =>
                setSettings({ ...settings, minIncrementKg: Number(e.target.value) })
              }
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">원판 단위 (kg)</span>
            <Input
              type="number"
              step="0.5"
              value={settings.plateUnitKg}
              onChange={(e) => setSettings({ ...settings, plateUnitKg: Number(e.target.value) })}
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>1RM (kg)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SEED_KEYS.map((key) => (
            <label key={key} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium">{key}</span>
              <Input
                type="number"
                className="max-w-[120px]"
                value={settings.oneRmKg[key] ?? ""}
                onChange={(e) => {
                  const next = { ...settings.oneRmKg };
                  if (e.target.value === "") delete next[key];
                  else next[key] = Number(e.target.value);
                  setSettings({ ...settings, oneRmKg: next });
                }}
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button type="button" onClick={() => void save()}>
        저장
      </Button>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}
