import { AppData } from "../../readers/get_app_data";
import { join } from "../../utils/path";
import { generateFile } from "../index";

// Single source of agent rules. AgentSync links it to CLAUDE.md, AGENTS.md and each agent's file.
const gen_agents_md = async ({ UmbrellaDir }: AppData) => {
  const dir = join(UmbrellaDir || "", ".agents");
  const filename = "AGENTS.md";
  const content = `# Agent Instructions

This file is the single source of agent rules. Edit \`.agents/AGENTS.md\`, then run \`pnpm run agents\` (AgentSync) to relink it to each agent's file.

Read and follow the code style and structure rules in \`.cursorrules\` and in each app's \`.cursorrules\`.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run \`graphify query "<question>"\` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use \`graphify path "<A>" "<B>"\` for relationships and \`graphify explain "<concept>"\` for focused concepts. When the answer is under a Markdown heading, \`graphify section "<heading>"\` prints that section's text, so the .md need not be opened.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run \`graphify update .\` to keep the graph current (AST-only, no API cost).
- If graphify is not installed, install it with \`uv tool install graphifyy\` (or \`pipx install graphifyy\`), then run \`graphify <agent> install\` for your agent and \`graphify update .\`.
`;

  return generateFile({ filename, dir, content }, "gen_agents_md");
};

export { gen_agents_md };
