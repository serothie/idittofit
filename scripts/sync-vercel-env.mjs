// .env.local에서 Vercel에 올릴 키만 읽어 JSON으로 출력 (값은 stdout, 채팅에 붙이지 말 것)
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "GEMINI_API_KEY",
  "PING_TOKEN",
];

const envPath = join(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}
const lines = readFileSync(envPath, "utf8").split("\n");
const map = {};
for (const line of lines) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
  if (m) map[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const out = {};
for (const k of KEYS) {
  if (map[k]) out[k] = map[k];
}
process.stdout.write(JSON.stringify(out));
