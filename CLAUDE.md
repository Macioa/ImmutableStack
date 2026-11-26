@.cursorrules

## CRITICAL CLAUDE RULE: Sample Projects

- ALWAYS initialize a local git repository when creating a sample project.
- Create sample projects in `~/Documents/GitHub`. ALWAYS init with `-sqlite` (unless Postgres is requested) and `-cache`, so every sample project shares the one dependency cache at `~/.immutable_dep_cache`:
  ```bash
  cd ~/Documents/GitHub
  immutable -init sample_proj -sqlite -cache
  cd sample_proj_umbrella
  git init && git add -A && git commit -m "immutable -init sample_proj -sqlite -cache"
  ```
- Postgres only when requested: `immutable -init sample_proj -cache`
- ALWAYS make a local commit in the sample project after each `immutable` command.
- When reading a sample or generated project, run `graphify query` from that project's folder first, against its own `graphify-out/`, before grepping or reading its files. Its own CLAUDE.md is not loaded while working from ImmutableStack, so this rule covers it.
- When changing the Immutable tools, make and verify the change in the sample project first, then use the sample project's git diff to update the generators so their output stays consistent.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. When the answer is under a Markdown heading, `graphify section "<heading>"` prints that section's text, so the .md need not be opened. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
