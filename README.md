# idittofit

플랜 TXT · 오늘 기록 · 추천 무게 · 다음 주 생성 (1주차 MVP).

## 로컬

```bash
npm install
cp .env.example .env.local  # GEMINI_API_KEY, Supabase, PING_TOKEN
npm run dev
```

Google 로그인: [docs/setup-google-auth.md](docs/setup-google-auth.md)

## 주요 URL

| 경로 | 설명 |
|------|------|
| `/today` | 오늘 플랜 · 기록 |
| `/week` | 월~토 주간 |
| `/plan/import` | 플랜 TXT 파싱 |
| `/plan/generate` | AI 다음 주 TXT |
| `/memo` | 메모 규칙 파서 + AI |
| `/settings` | 1RM · 추천 설정 |
| `/history` | 종목별 PR 차트 |

## 스크립트

- `npm test` — Vitest
- `npm run build` — pre-commit과 동일
- `bash scripts/check-setup.sh --full`

## 배포

Vercel + Supabase. env: `NEXT_PUBLIC_SUPABASE_*`, `GEMINI_API_KEY`, `PING_TOKEN`.
