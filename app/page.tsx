import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "cn";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-start justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">idittofit</h1>
      <p className="text-muted-foreground">플랜 · 기록 · 추천 무게 (1주차 개발 중)</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/plan/import" className={cn(buttonVariants())}>
          플랜 가져오기
        </Link>
        <Link href="/login" className={cn(buttonVariants({ variant: "outline" }))}>
          로그인
        </Link>
      </div>
    </main>
  );
}
