"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import { LogoutButton } from "./user-nav";

const NAV = [
  { href: "/today", label: "오늘" },
  { href: "/week", label: "주간" },
  { href: "/memo", label: "메모" },
  { href: "/plan/import", label: "플랜" },
  { href: "/history", label: "기록" },
  { href: "/settings", label: "설정" },
] as const;

function NavLink({ href, label, compact }: { href: string; label: string; compact?: boolean }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        compact && "flex flex-1 flex-col items-center gap-0.5 px-2 py-2 text-xs",
      )}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-muted/30 md:flex">
        <div className="border-b border-border px-4 py-5">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            idittofit
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">플랜 · 기록</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <LogoutButton className="w-full justify-start" />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:hidden">
          <Link href="/" className="font-semibold">
            idittofit
          </Link>
          <LogoutButton className="h-8 px-2 text-xs" />
        </header>

        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 gap-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          {NAV.slice(0, 3).map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} compact />
          ))}
        </nav>
      </div>
    </div>
  );
}
