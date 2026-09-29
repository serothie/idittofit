// 커서 훅: 로그 기록 + 위험 명령 확인 + 비밀 파일 읽기 차단
// 원본 로그: .ai-logs/raw/*.jsonl (gitignore). 기록 시점에 이미 민감 정보를 가린다.
import { appendFileSync, mkdirSync } from "node:fs";
import { join, relative, isAbsolute } from "node:path";
import { makeRedactor } from "./redact.mjs";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;
const input = JSON.parse(raw || "{}");

const root = input.workspace_roots?.[0] ?? process.cwd();
const redact = makeRedactor(root);
const logDir = join(root, ".ai-logs", "raw");
mkdirSync(logDir, { recursive: true });

const event = input.hook_event_name ?? "unknown";
const rel = (p) => (p && isAbsolute(p) ? relative(root, p) : p);

// 승인 없이 실행되면 안 되는 셸 명령
const RISKY_SHELL = [/git\s+push/, /git\s+reset\s+--hard/, /rm\s+-rf/, /supabase\s+db\s+(reset|push)/, /vercel\s+.*--prod/];

// 셸로 비밀 파일을 직접 여는 것도 막는다 (파일 읽기 훅은 셸 명령을 거치지 않음)
// .env.local 읽기·source는 허용 (운영 env 동기화). 그 외 .env* 셸 접근은 차단
const SECRET_SHELL = [
  /(^|[\s'"/=])\.env(?!\.local)(\.[\w-]+)?(\s|$|['"])/,
  /\.ai-logs\/raw/,
  /denylist\.txt/,
];

// MCP는 "조회 도구만 통과, 나머지는 전부 확인"으로 판단한다 (위험 목록을 늘리는 것보다 빈틈이 적다)
const mcpName = (name = "") => name.split(/__|\.|:|\//).pop().toLowerCase();
const MCP_READ_ONLY = /^(get|list|search|query|fetch|read|document|describe)[_-]|^generate_typescript_types$|^get-|^document-by-id$/;
const MCP_SECRET = /token|secret|api[_-]?key|keys|credential|env/; // 조회라도 비밀값을 돌려줄 수 있는 도구
const MCP_DENY = /^buy[_-]|confirm_cost|create_api_keys/; // 비용·키 발급은 아예 막음

// AI가 읽으면 안 되는 파일
const SECRET_FILES = [
  /(^|\/)\.env(?!\.local)(\.[\w-]+)?$/,
  /(^|\/)\.ai-logs\/raw\//,
  /denylist\.txt$/,
];

let decision = null;
if (event === "beforeShellExecution") {
  const cmd = input.command ?? "";
  if (SECRET_SHELL.some((r) => r.test(cmd))) decision = "deny";
  else if (RISKY_SHELL.some((r) => r.test(cmd))) decision = "ask";
}
if (event === "beforeMCPExecution") {
  const name = mcpName(input.tool_name);
  if (MCP_DENY.test(name)) decision = "deny";
  else if (!MCP_READ_ONLY.test(name) || MCP_SECRET.test(name)) decision = "ask";
}
if (event === "beforeReadFile" && SECRET_FILES.some((r) => r.test(rel(input.file_path) ?? ""))) decision = "deny";

const base = { ts: new Date().toISOString(), event, conversation: input.conversation_id, generation: input.generation_id };
const write = (file, obj) => appendFileSync(join(logDir, file), JSON.stringify(obj) + "\n");

if (event === "beforeSubmitPrompt") {
  write("prompts.jsonl", { ...base, prompt: redact(input.prompt) });
} else if (event === "afterAgentResponse") {
  write("responses.jsonl", { ...base, text: redact(input.text) });
} else if (event === "beforeReadFile") {
  if (decision) write("tools.jsonl", { ...base, file: rel(input.file_path), gate: decision });
} else {
  write("tools.jsonl", {
    ...base,
    command: redact(input.command),
    tool: input.tool_name,
    file: rel(input.file_path),
    edits: input.edits?.length,
    gate: decision,
  });
}

// before 계열 훅은 응답을 기다린다
if (event === "beforeSubmitPrompt") {
  console.log(JSON.stringify({ continue: true }));
} else if (event.startsWith("before")) {
  const msg = {
    ask: "위험 명령입니다. 승인된 계획에 있는 작업인지 확인하세요.",
    deny: "허용되지 않은 작업입니다 (비밀 파일 읽기 또는 비용·키 발급).",
  };
  console.log(JSON.stringify(decision ? { permission: decision, userMessage: msg[decision], agentMessage: msg[decision] } : { permission: "allow" }));
}