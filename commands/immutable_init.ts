/*
** Immutable Init **
    Initialize a new project with Immutable Stack
      - requires a project name as an argument
*/
import { fetch_assets } from "@/assets";
import { install_all_deps } from "@/composite/init_deps";
import { init_docker } from "@/composite/init_docker";
import { init_graphify } from "@/composite/init_graphify";
import { init_phoenix_umbrella_app, scaffold_phoenix_umbrella } from "@/composite/init_phoenix/init_phoenix_umbrella_app";
import { build_tool_agnostic_init_tasks } from "@/composite/init_react/build_tool_agnostic_init_tasks";
import { init_react_app_with_vite, scaffold_react_app_with_vite } from "@/composite/init_react/init_react_app_with_vite";
import { gen_all_configs } from "@/generators/init_configs";
import { inject_sample_release_mix } from "@/injectors/init_docker/inject_sample_release_mix";
import { appDataFromAppnNameSnake, setAppData } from "@/readers/get_app_data";
import { execute as exec } from "@/runners";
import { setUmbrellaDirCache, writeLog } from "@/utils/history_cache";
import { log, setLogFile, setLogLevel } from "@/utils/logger";
import { formatSeconds, timed } from "@/utils/profile";
import { flushFormat, setDeferredFormat } from "@/utils/format";
import { promptGitDomain } from "@/prompts/git";
import { initGitRepository, addGitSubmodules } from "@/utils/git";
import { join } from "@/utils/path";
import { applyPinnedVersions } from "@/utils/versions";
import { parseFlags } from "@/utils/flags";
import { DEFAULT_CACHE_DIR, link_dep_cache } from "@/utils/dep_cache";

setLogLevel(5);

const args = process.argv.slice(2);
const { db, cache } = parseFlags(args);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: node init_proj.js <project_name> [-sqlite] [-cache]\n   Or: immutable -init <project_name> [-sqlite] [-cache]"
    );
    process.exit(1);
  }
  applyPinnedVersions(__dirname);

  let projectName = args[0]
    .toLowerCase()
    .replace(/[\s-]/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const AppData = await appDataFromAppnNameSnake(projectName, false, db);
  setAppData(AppData);
  const { AppNameSnake, UmbrellaDir } = AppData;
  const initStart = Date.now();

  // -cache streams logs to a file, skipping the terminal reading delay
  const logFile = cache ? setLogFile(join(DEFAULT_CACHE_DIR, "logs", `${AppNameSnake}_init.log`)) : null;
  if (logFile) process.stdout.write(`Logging to ${logFile}\n`);

  // Files are formatted in one pass at the end; injectors needing formatted input use formatFirst
  setDeferredFormat(true);

  // Prompt for git domain
  const gitDomain = await promptGitDomain();

  log(
    { level: 1, color: "GREEN" },
    `\n\n Generating ${AppNameSnake} App with Immutable Stack\n\n`
  );
  setUmbrellaDirCache(UmbrellaDir);

  const _dir = await exec(
    { command: `mkdir -p .`, dir: UmbrellaDir },
    "init_proj"
  );

  // Phoenix and Vite scaffold into separate folders, so they run together
  const _scaffold = await timed("scaffold (phx.new + vite)", () =>
    Promise.all([
      init_docker(AppData),
      scaffold_phoenix_umbrella(AppData),
      scaffold_react_app_with_vite(AppData, 'ui', { offline: cache }),
    ])
  );
  const _init = await timed("configure phoenix + assets", () =>
    Promise.all([
      init_phoenix_umbrella_app(AppData, 'ui', 'web', { scaffold: false }),
      fetch_assets(AppData, 'ui'),
    ])
  );
  const _react = await timed("configure react", () =>
    init_react_app_with_vite(AppData, 'ui', { scaffold: false })
  );
  const _build_tools = await timed("ui build tools", () => build_tool_agnostic_init_tasks(AppData, 'ui'));
  const _configs = await timed("configs + release", async () => [
    await gen_all_configs(AppData),
    await inject_sample_release_mix(AppData),
  ]);

  const _format = await timed("format (one pass)", async () => {
    setDeferredFormat(false);
    return flushFormat();
  });

  if (cache) link_dep_cache(AppData);

  writeLog(UmbrellaDir, `init_project_${projectName}`);
  // Compiling is left to the first mix phx.server
  const _deps = await timed("deps (mix + pnpm)", () => install_all_deps(AppData, { offline: cache }));

  const _cleanup = await exec(
    {
      command: `rm -rf ${AppNameSnake} ${AppNameSnake}_umbrella`,
      dir: UmbrellaDir,
    },
    "init_proj"
  );

  const _graphify = await timed("graphify (background)", () => init_graphify(AppData, { background: true }));

  log(
    { level: 1, color: "GREEN" },
    `\n\nInitialization Complete.\n\nGenerated ${projectName}_umbrella`
  );
  process.stdout.write(`  [time] ${"total".padEnd(28)} ${formatSeconds(Date.now() - initStart)}\n`);

  // Initialize git repository and submodules only if git domain is provided
  if (gitDomain) {
    await initGitRepository(UmbrellaDir, gitDomain);
    await addGitSubmodules(UmbrellaDir, join(UmbrellaDir, "apps"), gitDomain);

    log(
      { level: 1, color: "GREEN" },
      `\n\nGit repository initialized with submodules.\n\n`
    );
  }
}

main().catch(console.error);
