#!/usr/bin/env bash
# 레포 세팅 점검. 레포 루트에서 실행: bash scripts/check-setup.sh
# 값(API 키 등)은 출력하지 않는다.

PASS=0; FAIL=0
ok()   { echo "  ✅ $1"; PASS=$((PASS+1)); }
bad()  { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

echo "1. 있어야 하는 파일"
for f in \
  CLAUDE.md AGENTS.md README.md .gitignore .cursorignore \
  docs/PLAN.md docs/reference/notation-ataraxia.md docs/reference/program-samples.md \
  .cursor/hooks.json .cursor/hooks/hook.mjs .cursor/hooks/redact.mjs \
  .husky/pre-commit scripts/pre-commit.sh \
  .cursor/rules/workflow.mdc \
  .cursor/agents/researcher.md .cursor/agents/planner.md .cursor/agents/reviewer.md \
  fixtures/public/memo-examples.txt scripts/sanitize-logs.mjs \
  package.json package-lock.json components.json app/layout.tsx lib/utils.ts; do
  [ -f "$f" ] && ok "$f" || bad "$f 없음"
done

n=$(ls fixtures/private/plans/sample-*/*.txt 2>/dev/null | wc -l | tr -d ' ')
[ "$n" = "24" ] && ok "플랜 원문 24개" || bad "플랜 원문 ${n}개 (24개여야 함)"

echo "2. 없어야 하는 파일"
for f in .gitignore.additions .cursor/agents/implementer.md yarn.lock .cursor/hooks/hooks.json; do
  [ -e "$f" ] && bad "$f 가 남아 있음 (삭제 필요)" || ok "$f 없음"
done

echo "3. gitignore"
mkdir -p .ai-logs/raw
for f in .env.local .ai-logs/raw/test.jsonl fixtures/private/plans/sample-1/01-load-1.txt; do
  git check-ignore -q "$f" && ok "$f 제외됨" || bad "$f 가 커밋될 수 있음"
done
git ls-files | grep -qE '(^|/)\.env' && bad ".env 파일이 이미 커밋되어 있음" || ok ".env 파일 커밋 기록 없음"

echo "4. 문서 경로·연결"
grep -q "src/" CLAUDE.md .cursor/rules/workflow.mdc 2>/dev/null && bad "문서에 src/ 경로가 남아 있음" || ok "src/ 경로 없음"
grep -q "nextjs-agent-rules" AGENTS.md && ok "AGENTS.md Next.js 블록 유지" || bad "AGENTS.md Next.js 블록 없음"
grep -q "CLAUDE.md" AGENTS.md && ok "AGENTS.md → CLAUDE.md 안내 있음" || bad "AGENTS.md에 CLAUDE.md 안내 없음"
grep -q "alwaysApply: true" .cursor/rules/workflow.mdc && ok "workflow.mdc 항상 적용" || bad "workflow.mdc alwaysApply 없음"

echo "5. 훅 동작"
for f in .cursor/hooks/hook.mjs .cursor/hooks/redact.mjs scripts/sanitize-logs.mjs; do
  node --check "$f" 2>/dev/null && ok "$f 문법" || bad "$f 문법 오류"
done
for f in $(grep -o 'node [^"]*' .cursor/hooks.json | awk '{print $2}' | sort -u); do
  [ -f "$f" ] && ok "hooks.json 경로 $f 존재" || bad "hooks.json이 가리키는 $f 가 없음 (훅이 실패함)"
done
for a in .cursor/agents/planner.md .cursor/agents/reviewer.md; do
  grep -qE '^model: .*[][]' "$a" && bad "$a model 값에 괄호가 있음" || ok "$a model 값 형식"
done
TMP=$(mktemp -d)
out=$(echo "{\"hook_event_name\":\"beforeShellExecution\",\"command\":\"git push\",\"workspace_roots\":[\"$TMP\"]}" | node .cursor/hooks/hook.mjs 2>&1)
echo "$out" | grep -q '"ask"' && ok "git push → 확인 요청" || bad "git push 확인 요청 안 됨: $out"
out=$(echo "{\"hook_event_name\":\"beforeReadFile\",\"file_path\":\"$TMP/.env\",\"workspace_roots\":[\"$TMP\"]}" | node .cursor/hooks/hook.mjs 2>&1)
echo "$out" | grep -q '"deny"' && ok ".env 읽기 차단" || bad ".env 읽기 차단 안 됨: $out"
out=$(echo "{\"hook_event_name\":\"beforeReadFile\",\"file_path\":\"$TMP/.env.local\",\"workspace_roots\":[\"$TMP\"]}" | node .cursor/hooks/hook.mjs 2>&1)
echo "$out" | grep -q '"allow"' && ok ".env.local 읽기 허용" || bad ".env.local 허용 안 됨: $out"
echo "{\"hook_event_name\":\"beforeSubmitPrompt\",\"prompt\":\"AIzaSyA1234567890abcdefghijkl test@example.com\",\"workspace_roots\":[\"$TMP\"]}" | node .cursor/hooks/hook.mjs >/dev/null 2>&1
if grep -q "AIza\|test@example.com" "$TMP/.ai-logs/raw/prompts.jsonl" 2>/dev/null; then bad "로그에 키·이메일이 그대로 남음"
elif [ -f "$TMP/.ai-logs/raw/prompts.jsonl" ]; then ok "로그 기록 + 민감 정보 가림"
else bad "로그 파일이 안 생김"; fi
rm -rf "$TMP"

echo "6. 환경변수 (값은 출력 안 함)"
for k in GEMINI_API_KEY PING_TOKEN NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY; do
  grep -qE "^$k=.+" .env.local 2>/dev/null && ok "$k 있음" || bad "$k 없음 (.env.local)"
done
[ -f app/api/ping/route.ts ] && ok "/api/ping 라우트" || bad "app/api/ping/route.ts 없음"
grep -qE "^NEXT_PUBLIC_GEMINI" .env.local 2>/dev/null && bad "Gemini 키에 NEXT_PUBLIC_이 붙어 있음 (브라우저 노출)" || ok "Gemini 키 서버 전용"

echo "7. 비밀값 커밋 기록"
# check-setup.sh 자체의 훅 테스트용 가짜 키 문자열은 제외
git log -p --all -- . ':(exclude)scripts/check-setup.sh' 2>/dev/null \
  | grep -qE "AIza[0-9A-Za-z_-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}" \
  && bad "커밋 기록에 키로 보이는 값이 있음 (공개 전 반드시 처리)" || ok "커밋 기록에 키 없음"

if [ "$1" = "--full" ]; then
  echo "8. 타입·린트 (시간 걸림)"
  npx tsc --noEmit >/dev/null 2>&1 && ok "타입 체크" || bad "타입 오류 (npx tsc --noEmit로 확인)"
  npm run lint >/dev/null 2>&1 && ok "린트" || bad "린트 오류 (npm run lint로 확인)"
fi

echo
echo "결과: 통과 $PASS / 실패 $FAIL"
[ "$FAIL" = "0" ]