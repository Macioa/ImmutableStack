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
- Query with names, not loose keywords: `graphify explain "<function or file>"` and `graphify path "<A>" "<B>"` on exact node names return the right subgraph; broad keyword queries ("os detection") return unrelated nodes. Start with a query only to find those names, then switch to explain/path.
- A PreToolUse hook (.claude/hooks/graph_first.js) blocks grep until one of those graphify commands has run since the last user message. It is a floor, not the goal: after it unlocks, grep only for exact text in files the graph or the generator index named.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost). After changing anything in generators/, injectors/ or composite/, run `npm run index:generators` instead: it rebuilds docs/GENERATOR_INDEX.md, then updates the graph.
- The AST graph cannot see inside template strings, so the Elixir and TypeScript the generators write are not in it. To find which generator writes a module, config key, dep or route, use `graphify section "<generator path>"` or search docs/GENERATOR_INDEX.md (the grep guard always allows searching that file).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
