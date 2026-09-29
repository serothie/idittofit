승인됨: 2026-09-29

추가 요구: UI 뼈대 포함(추후 사용자 수정), Google 로그인, Vercel env 반영, `.env.local` 에이전트 읽기 허용.

## 목표

Drizzle+Supabase 스키마, Google OAuth 로그인, parsePlan API, 플랜 import UI 뼈대, Vitest 정답 5( fixture 기록).

## 범위

- 에이전트: DB, auth, lib/ai, API, UI 뼈대, hooks/cursorignore(.env.local 허용)
- 사용자: lib/parser/, UI 디테일 추후

## 확인

- 로그인 → /plan/import → parse → save
- bash scripts/check-setup.sh --full
