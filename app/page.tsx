import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "cn";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 md:px-8">
        <span className="text-lg font-semibold">idittofit</span>
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          로그인
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-8 md:flex-row md:items-center md:justify-between md:gap-16 md:px-8 md:pt-16">
        <div className="max-w-xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            플랜과 기록을 한곳에서
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            코치 플랜 TXT를 가져오고, 운동할 때는 오늘 처방과 추천 무게를 보며 기록합니다.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/today" className={cn(buttonVariants({ size: "lg" }))}>
              오늘 화면
            </Link>
            <Link href="/plan/import" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
              플랜 가져오기
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Google 로그인
            </Link>
          </div>
        </div>
        <div className="hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:block md:max-w-md md:flex-1">
          <p className="text-sm font-medium">1주차 개발 중</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>· 플랜 AI 파싱 · 표로 확인</li>
            <li>· 오늘 화면 · 주간 보기 (예정)</li>
            <li>· 추천 무게 · 다음 주 생성 (예정)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
