// Graph first: blocks Grep (and grep/rg in shell commands) until a graphify
// query, explain, path or section has run since the user's last message.
//   node graph_first.js reset   (UserPromptSubmit) clears the marker
//   node graph_first.js check   (PreToolUse: Bash|PowerShell|Grep) sets or enforces it
// Logs, temp files and tool output are exempt: the graph does not cover them.
const fs = require("fs");
const os = require("os");
const path = require("path");

const GRAPH_CMD = /\bgraphify(\.exe)?\s+(query|explain|path|section)\b/i;
const SEARCH_CMD = /(^|[|;&(\s])(grep|egrep|fgrep|rg|findstr|Select-String|sls)(\s|$)/i;
const EXEMPT = /\.log\b|tool-results|[\\/]tasks[\\/]|AppData[\\/]Local[\\/]Temp|scratchpad|graphify-out|GENERATOR_INDEX/i;

const marker = (session) => path.join(os.tmpdir(), "claude-graph-first", `${session || "default"}.ok`);

const deny = (reason) =>
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    })
  );

const REASON =
  'Graph first: run `graphify query "<question>"` (or explain/path/section with an exact node name) ' +
  "before grepping this turn, then grep only for exact text in files the graph named. " +
  'For template content inside generators, start with `graphify section "<generator or term>"` (docs/GENERATOR_INDEX.md).';

const searched = ({ tool_name, tool_input = {} }) => {
  switch (tool_name) {
    case "Grep":
      return !EXEMPT.test(tool_input.path || "");
    case "Bash":
    case "PowerShell":
      return SEARCH_CMD.test(tool_input.command || "") && !EXEMPT.test(tool_input.command || "");
    default:
      return false;
  }
};

const check = (input) => {
  const file = marker(input.session_id);
  const command = (input.tool_input && input.tool_input.command) || "";
  if (GRAPH_CMD.test(command)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return fs.writeFileSync(file, "");
  }
  if (searched(input) && !fs.existsSync(file)) deny(REASON);
};

const reset = (input) => fs.rmSync(marker(input.session_id), { force: true });

const main = (raw) => {
  const input = JSON.parse(raw || "{}");
  switch (process.argv[2]) {
    case "reset":
      return reset(input);
    default:
      return check(input);
  }
};

let raw = "";
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  try {
    main(raw);
  } catch (_err) {
    // Never break a tool call because the guard itself failed
  }
});
