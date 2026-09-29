"use client";

import { safeNextPath } from "@/lib/auth/safeNextPath";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const error = searchParams.get("error");

  async function signInWithGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>Google 계정으로 로그인합니다.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error ? (
          <p className="text-sm text-destructive">로그인에 실패했습니다. 다시 시도해 주세요.</p>
        ) : null}
        <Button type="button" onClick={() => void signInWithGoogle()}>
          Google로 계속
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background p-6">
      <div className="mb-8 text-center">
        <p className="text-lg font-semibold">idittofit</p>
        <p className="text-sm text-muted-foreground">플랜 · 기록</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
