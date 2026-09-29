# 1주차 잔여 일정 스프린트 (목~일)

승인됨: 2026-09-29

추가: 메모 AI fallback 포함. C(일정 축소)는 **차트·재생성 UI 모두 구현**, 품질·엣지는 일요일 수동 QA로 보완.

## 현재 기준선

- **원격:** `f1579b9` (화요일). **로컬 미커밋:** UX 셸·import 표 편집·수요일 오늘/주간·API 다수.
- **완료(PLAN):** 월~수 체크박스 전부 `[x]`.
- **미착수:** `lib/parser/`, `lib/notation/` 없음. `generatePlan` / `parseMemo` 없음. 1RM·추천 무게·차트·manifest 없음.

## 스프린트 원칙

1. **에이전트가 UI·파서·API 전부 구현** (1주차 UX 예외 + 이번 스프린트 명시).
2. **MVP 우선:** PLAN 위험表 — 차트 1개, WOD는 점수만, 디자인 기본, 메모 AI는 **실패 줄만**.
3. **배포 단위:** Phase마다 커밋 가능한 상태 (pre-commit 통과).
4. **DB:** 1주차는 `athletes.settings` jsonb 위주; **새 테이블은 필수일 때만** (마이그레이션 전 SQL 공개).

---

## Phase 0 — 기준선 고정 (0.5일)

| 작업 | 내용 |
|------|------|
| 커밋·푸시 | UX + 수요일 + 계획 문서 2건 |
| 수요일 마무리 | `/today` 기록 탭: `GET /api/log/day` 반영해 **저장된 기록 재편집** |
| 문서 | `CLAUDE.md`에 「1주차 스프린트: parser 포함 에이전트 구현」한 줄 |

**확인:** 배포 환경 login → week → today → log 저장·재조회.

---

## Phase 1 — 목요일 핵심 (1~2일)

### 1-A. 규칙 파서 + 메모 미리보기

| 항목 | 범위 |
|------|------|
| 구조 | `lib/notation/core/` (단위, 5x5, @tempo, %), `lib/notation/presets/ataraxia/` (최소 약어), `lib/parser/` (줄 단위 → `LoggedSet` 후보) |
| 테스트 | `fixtures/public/memo-examples.txt` + 합성 15~20케이스 Vitest (**AI 없음**) |
| UI | `/memo` — textarea + 실시간 미리보기(성공/실패 줄 구분), 「오늘 기록에 반영」은 **선택** (MVP: 미리보기 + 수동 복사 또는 `/today` date 연동 POST) |
| API | `POST /api/memo/parse` — 규칙만, 실패 줄 목록 반환 |

**의도적 축소:** 종목 사전 전체·오타 AI·개인 사전 UI → 2주차. ataraxia는 `docs/reference/notation-ataraxia.md`에서 **상위 빈도 20~30 패턴만**.

### 1-B. 1RM · 추천 무게

| 항목 | 범위 |
|------|------|
| 설정 | `athletes.settings`: `oneRmKg`, `planWeightRatio`, `minIncrementKg`, `plateUnitKg` (기본값 상수 + UI `/settings`) |
| API | `GET/PATCH /api/athlete/settings`, `GET /api/recommend/today?date=` |
| 로직 | `lib/recommend/` — Epley, %→kg, 지난주 same exercise max, 증량·원판 반올림·1RM cap (Vitest 10+) |
| UI | `/today` 플랜 탭: 종목별 **추천 무게** 배지; `/settings` 1RM 표 (exercises 시드 + key) |

**DB 변경:** 없음 (settings jsonb만).

---

## Phase 2 — 금요일 (0.5~1일)

| 항목 | 범위 |
|------|------|
| AI | `lib/ai/generatePlan.ts` + zod 스키마, `parsePlan`과 동일 env/usage 패턴 |
| API | `POST /api/plan/generate` — 입력: 앵커 주·(선택) 피드백·지난 plan 원문/기록 요약(서버 조회) |
| UI | `/plan/generate` — 생성 TXT 미리보기 → **기존 import 파이프** (붙여넣기 또는 바로 parse) |
| 한도 | `ai_usage.generate_plan_count` + 일일 상한 env |

---

## Phase 3 — 토요일 (1~1.5일)

| 항목 | 범위 |
|------|------|
| 재생성 | generate API에 `feedback` 문자열 → 재호출; 결과 **텍스트 복사** 버튼 |
| 메모 AI | `lib/ai/parseMemo.ts` — **실패 줄만** batch; `POST /api/memo/parse`에 `useAi: true` 옵션 + quota |
| 기록·차트 | `/history` — 종목 select, `logged_sets` 집계, **최고 기록 1개 라인 차트** (`recharts` 추가) |
| PWA | `app/manifest.ts` + 아이콘 placeholder, meta theme; 「홈 화면 추가」 가능 수준 |

**의도적 축소:** 종목별 전체 테이블·WOD 분해·여러 차트 없음.

---

## Phase 4 — 일요일 (0.5일)

| 항목 | 범위 |
|------|------|
| README | 설치, env, Google auth 링크, 주요 URL |
| PLAN.md | 목~일 `[x]` 갱신, 회고 3줄 |
| 버그 | 스프린트 중 발견분 |
| 정리 | 미사용 drizzle 의존성 **제거 검토**, middleware 중복 정리, usage TOCTOU **시간 있으면** RPC |

---

## 구현 순서 (권장)

```
0 → 1-B.settings (추천이 today에 필요) → 1-A.parser → 1-B.recommend UI
→ 2 generate → 3 history/chart/memo AI/manifest → 4 README
```

병렬 가능: 1-A 테스트 작성 ↔ 1-B pure functions.

---

## 새 파일 (요약)

- `lib/notation/**`, `lib/parser/**`, `lib/recommend/**`
- `lib/ai/generatePlan.ts`, `lib/ai/schemas/planGenerate.ts`, `parseMemo.ts`
- `app/(shell)/memo`, `settings`, `history`, `plan/generate`
- `app/api/memo/parse`, `athlete/settings`, `recommend/today`, `plan/generate`
- `tests/parser*.test.ts`, `tests/recommend*.test.ts`
- `app/manifest.ts`, `public/icons/*`

## 패키지

- `recharts` (차트 1개). 그 외 추가 없음 목표.

---

## 영향·리스크

| 리스크 | 대응 |
|--------|------|
| 파서 범위 폭발 | ataraxia **최소 패턴**; 실패는 memo AI·수동 |
| generate 품질 | 금요일: `fixtures/private` 샘플은 **로컬만** 참고, 프롬프트에 program-samples 요약 |
| Gemini 한도 | parse/generate/memo AI 각각 `ai_usage` + env 상한 |
| 일정 초과 | **토:** manifest·history **또는** memo AI 중 하나를 일요일로 미룸 (사용자 선택) |

---

## 확인 (스프린트 Definition of Done)

- [ ] `npm test`, `tsc`, `next build`, `check-setup.sh --full`
- [ ] 로컬: import → week → today(추천 무게) → memo parse → generate → import 저장
- [ ] Vercel 배포 후 동일 smoke (로그인)
- [ ] 비밀값·원문 private fixtures 커밋 없음

---

## 승인 시 다음 액션

1. 본 파일 상단을 `승인됨: YYYY-MM-DD`로 갱신.  
2. **Phase 0부터** 구현; Phase 완료마다 짧은 보고.  
3. DB 마이그레이션이 필요해지면 **SQL 전문을 먼저** 제출.

## 사용자 결정 요청 (선택)

- **A (권장):** 토요일 AI memo fallback **포함**
- **B:** 1주차는 memo **규칙 파서 only**, AI는 2주차
- **C:** 일정 더 줄이기 → chart **또는** generate 재생성 UI 중 하나 Phase 4로
