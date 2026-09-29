승인됨: 2026-09-29 (사용자: 수요일 PLAN 우선 승인)

## 목표

- **오늘** (`/today`): 해당 날짜 플랜 표시 + 탭(플랜 | 기록), 기록 입력 기본값 = 처방
- **주간** (`/week`): 월~토 한 화면, 플랜 유무·기록 완료 체크, 날짜 탭 → 오늘

## API

- `GET /api/plan/day?date=` — plan_days + parts + entries
- `GET /api/plan/week?date=` — anchor 주의 월~토 요약 (hasPlan, hasLog)
- `GET|POST /api/log/day?date=` — 당일 logged_sets 조회·저장 (당일 재저장 시 해당일 기록 교체)

## UI

- `(shell)` 레이아웃, nav에 오늘·주간
- middleware: `/today`, `/week`, `/api/plan/day`, `/api/plan/week`, `/api/log/day` 보호

## 확인

- import 저장된 날 → 오늘/주간 표시 → 기록 저장 → 주간 체크
- `npm test`, `tsc`, `npm run build`
