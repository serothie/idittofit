// .env.local에 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없으면 추가
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const envPath = join(root, ".env.local");
const anon = process.argv[2];
if (!anon) {
  console.error("Usage: node scripts/ensure-supabase-env.mjs <NEXT_PUBLIC_SUPABASE_ANON_KEY>");
  process.exit(1);
}
let content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
if (/^NEXT_PUBLIC_SUPABASE_ANON_KEY=/m.test(content)) {
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY already set");
  process.exit(0);
}
if (content && !content.endsWith("\n")) content += "\n";
content += `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\n`;
writeFileSync(envPath, content);
console.log("Added NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
