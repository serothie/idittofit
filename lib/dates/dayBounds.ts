/** YYYY-MM-DD 하루 구간 (KST) — logged_sets performed_at 필터용 */
export function kstDayBoundsUtcIso(date: string): { start: string; end: string } {
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(`${date}T23:59:59.999+09:00`);
  return { start: start.toISOString(), end: end.toISOString() };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parsePlanDate(raw: string | null): string | null {
  if (!raw || !DATE_RE.test(raw)) return null;
  return raw;
}

/** anchor 날짜가 속한 주의 월요일~토요일 (6일, 크로스핏 박스 주간) */
export function weekMonSat(date: string): string[] {
  const d = new Date(`${date}T12:00:00+09:00`);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    const x = new Date(monday);
    x.setDate(monday.getDate() + i);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, "0");
    const dd = String(x.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${dd}`);
  }
  return out;
}

export function todayKstDate(): string {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const y = kst.getFullYear();
  const m = String(kst.getMonth() + 1).padStart(2, "0");
  const d = String(kst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
