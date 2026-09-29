승인됨: 2026-09-29

추가: UI·화면 세부까지 **에이전트**가 구현. (CLAUDE.md 사용자 전담 규칙은 1주차 UX 마일스톤 동안 예외)

## 목표

모바일 우선 + 데스크톱 여백·내비, 로그아웃, 플랜 import **JSON 제거 → 테이블/폼 편집**, 공통 앱 셸.

## 수정·추가 파일

- `docs/PLAN.md` — 수요일 전 UX 항목 명시
- `CLAUDE.md` — 1주차 UX는 에이전트 구현 (한 줄)
- `app/layout.tsx` — 메타, lang=ko
- `app/(shell)/layout.tsx` — AppShell
- `components/layout/app-shell.tsx`, `user-nav.tsx`
- `components/plan/plan-import-editor.tsx` (+ 하위 편집 UI)
- `app/(shell)/plan/import/page.tsx` — 편집기 연동
- `app/api/exercises/route.ts` — 종목 목록 (select용)
- `app/api/plan/save/route.ts` — 같은 날 재저장 시 기존 part 삭제 후 insert
- `app/page.tsx` — 랜딩 레이아웃 (셸 밖)

## 패키지

없음 (기존 shadcn Input/Tabs/Card/Button)

## 확인

- 로그인 → import → 파싱 → 테이블 수정 → 저장
- 모바일·데스크톱에서 nav·로그아웃
- `npm test`, `tsc`, `npm run build`
