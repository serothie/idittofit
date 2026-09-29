#!/usr/bin/env bash
# git pre-commit: sanitize AI 로그 → tsc → next build (캐시는 .next/cache)
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ AI 로그 sanitize (.ai-logs/raw → ai-logs/)"
node scripts/sanitize-logs.mjs

if compgen -G "ai-logs/*.jsonl" > /dev/null 2>&1; then
  git add ai-logs/*.jsonl
fi

echo "→ TypeScript (tsc --noEmit)"
npx tsc --noEmit

echo "→ Next.js build (증분 캐시: .next/cache)"
npm run build
