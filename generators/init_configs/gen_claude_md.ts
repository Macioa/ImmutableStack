import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_claude_md = async ({ UmbrellaDir }: AppData) => {
  const dir = UmbrellaDir || "";
  const filename = "CLAUDE.md";
  const content = `@.cursorrules
@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run \`graphify query "<question>"\` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use \`graphify path "<A>" "<B>"\` for relationships and \`graphify explain "<concept>"\` for focused concepts. When the answer is under a Markdown heading, \`graphify section "<heading>"\` prints that section's text, so the .md need not be opened.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run \`graphify update .\` to keep the graph current (AST-only, no API cost).
- If graphify is not installed, install it with \`uv tool install graphifyy\` (or \`pipx install graphifyy\`), then run \`graphify claude install\` and \`graphify update .\`.
`;

  return generateFile({ filename, dir, content }, "gen_claude_md");
};

export { gen_claude_md };
