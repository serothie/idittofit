const DEFAULT_NEXT = "/plan/import";

/** OAuth/로그인 후 리다이렉트 경로 — 상대 경로만 허용 (open redirect 방지) */
export function safeNextPath(
  raw: string | null | undefined,
  fallback = DEFAULT_NEXT,
): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (raw.includes("@") || raw.includes("\\")) return fallback;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) return fallback;
  return raw;
}
