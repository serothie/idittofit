// 원본 로그(.ai-logs/raw) → 공개용 로그(ai-logs/)
// 실행: node scripts/sanitize-logs.mjs
// 결과를 직접 훑어본 뒤 커밋한다. 의심 패턴이 남아 있으면 경고를 출력하고 종료 코드 1을 돌려준다.
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { makeRedactor } from "../.cursor/hooks/redact.mjs";

const root = process.cwd();
const rawDir = join(root, ".ai-logs", "raw");
const outDir = join(root, "ai-logs");
const redact = makeRedactor(root);

if (!existsSync(rawDir)) {
  console.log("원본 로그가 없습니다:", rawDir);
  process.exit(0);
}
mkdirSync(outDir, { recursive: true });

const shortId = (id) => (id ? createHash("sha256").update(id).digest("hex").slice(0, 8) : undefined);
const SUSPICIOUS = [
  /AIza[0-9A-Za-z_-]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /@[A-Za-z0-9-]+\.[a-z]{2,}/,
  /\/Users\//,
  /\/home\//,
  /supabase\.co/,
  /\b[a-z][a-z0-9]{19}\b/,
];
let warnings = 0;

for (const file of readdirSync(rawDir).filter((f) => f.endsWith(".jsonl"))) {
  const lines = readFileSync(join(rawDir, file), "utf8").split("\n").filter(Boolean);
  const out = [];
  for (const line of lines) {
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (k === "conversation" || k === "generation") clean[k] = shortId(v);
      else if (v !== undefined && v !== null) clean[k] = redact(v);
    }
    const text = JSON.stringify(clean);
    if (SUSPICIOUS.some((r) => r.test(text))) {
      warnings++;
      console.warn(`[확인 필요] ${file}: ${text.slice(0, 160)}`);
    }
    out.push(text);
  }
  writeFileSync(join(outDir, file), out.join("\n") + (out.length ? "\n" : ""));
  console.log(`${file}: ${out.length}건`);
}

if (warnings) {
  console.warn(`\n의심 패턴 ${warnings}건. 커밋 전에 직접 확인하세요. 실명은 .ai-logs/denylist.txt에 추가하면 가려집니다.`);
  process.exit(1);
}
console.log("\n완료. ai-logs/를 훑어본 뒤 커밋하세요.");
