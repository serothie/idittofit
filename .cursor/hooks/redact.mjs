// 로그에 남기기 전에 민감 정보를 지운다. 훅과 scripts/sanitize-logs.mjs가 같이 쓴다.
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const MAX_TEXT = 1500; // 이보다 긴 텍스트(붙여넣은 플랜 원문 등)는 잘라서 요약만 남김

function loadDenylist(root) {
  // 실명 등 가릴 단어 목록. 한 줄에 하나. 이 파일 자체는 gitignore 대상
  const p = join(root, ".ai-logs", "denylist.txt");
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8").split("\n").map((s) => s.trim()).filter(Boolean);
}

export function makeRedactor(root) {
  const deny = loadDenylist(root);
  const rootEsc = root.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return function redact(value) {
    if (typeof value !== "string") return value;
    let s = value
      .replace(new RegExp(rootEsc, "g"), ".") // 절대경로 → 레포 기준 상대경로
      .replace(/AIza[0-9A-Za-z_-]{20,}/g, "[GEMINI_KEY]")
      .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "[JWT]")
      .replace(/\b(sk|sb|pk|rk)_[A-Za-z0-9_-]{16,}/g, "[SECRET]")
      .replace(/\bsk-[A-Za-z0-9_-]{16,}/g, "[SECRET]")
      .replace(/https?:\/\/[a-z0-9]{15,}\.supabase\.co/g, "[SUPABASE_URL]")
      .replace(/\b[a-z][a-z0-9]{19}\b/g, "[PROJECT_REF]")
      .replace(/postgres(ql)?:\/\/[^\s"']+/g, "[DB_URL]")
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL]")
      .replace(/\/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "/@[HOST]")
      .replace(/\b01[016789]-?\d{3,4}-?\d{4}\b/g, "[PHONE]")
      .replace(/(\/Users|\/home)\/[^/\s"']+/g, "~")
      .replace(/C:\\Users\\[^\\\s"']+/gi, "~");
    for (const word of deny) s = s.split(word).join("[NAME]");
    if (s.length > MAX_TEXT) {
      const hash = createHash("sha256").update(value).digest("hex").slice(0, 12);
      s = `${s.slice(0, 300)} …[TRUNCATED ${s.length} chars, sha256:${hash}]`;
    }
    return s;
  };
}
