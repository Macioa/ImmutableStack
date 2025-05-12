/*
** Immutable Init **
    Initialize a new project with Immutable Stack
      - requires a project name as an argument    
*/
import { init_docker } from "./composite/init_docker";
import { init_phoenix_umbrella_app } from "./composite/init_phoenix/init_phoenix_umbrella_app";
import { build_tool_agnostic_init_tasks } from "./composite/init_react/build_tool_agnostic_init_tasks";
import { init_react_app_with_vite } from "./composite/init_react/init_react_app_with_vite";
import { inject_sample_release_mix } from "./injectors/init_docker/inject_sample_release_mix";
import { appDataFromAppnNameSnake, setAppData } from "./readers/get_app_data";
import { execute as exec } from "./runners";
import { setUmbrellaDirCache, writeLog } from "./utils/history_cache";
import { log, setLogLevel } from "./utils/logger";

setLogLevel(5);

const args = process.argv.slice(2);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: node init_proj.js <project_name>\n   Or: immutable -init <project_name>"
    );
    process.exit(1);
  }

  let projectName = args[0]
    .toLowerCase()
    .replace(/[\s-]/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const AppData = appDataFromAppnNameSnake(projectName, false);
  setAppData(AppData);
  const { AppNameSnake, UmbrellaDir } = AppData;

  const _dir = await exec(
    { command: `mkdir -p ${AppNameSnake}_umbrella`, dir: "." },
    "init_proj"
  );

  setUmbrellaDirCache(UmbrellaDir);

  log(
    { level: 1, color: "GREEN" },
    `\n\n Generating ${AppNameSnake} App with Immutable Stack\n\n`
  );
  const _docker = await init_docker(AppData);
  const _init = await init_phoenix_umbrella_app(AppData);
  const _react = await init_react_app_with_vite(AppData);
  const _build_tools = await build_tool_agnostic_init_tasks(AppData);
  const _release = await inject_sample_release_mix(AppData);

  writeLog(UmbrellaDir, `init_project_${projectName}`);

  const _deps = await exec(
    {
      command: `mix deps.get`,
      dir: UmbrellaDir,
    },
    "init_proj"
  );

  const _compile = await exec(
    {
      command: `mix compile`,
      dir: UmbrellaDir,
    },
    "init_proj"
  );

  log(
    { level: 1, color: "GREEN" },
    `\n\nInitialization Complete.\n\nGenerated ${projectName}_umbrella`
  );
}

main().catch(console.error);
