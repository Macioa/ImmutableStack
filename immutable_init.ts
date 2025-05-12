/*
** Immutable Init **
    Initialize a new project with Immutable Stack
      - requires a project name as an argument    
*/
import { execute as exec } from "./runners";
import { log, setLogLevel } from "./utils/logger";

import { setUmbrellaDirCache, writeLog } from "./utils/history_cache";

import { init_docker } from "./composite/init_docker";
import { init_phoenix_umbrella_app } from "./composite/init_phoenix/init_phoenix_umbrella_app";
import { build_tool_agnostic_init_tasks } from "./composite/init_react/build_tool_agnostic_init_tasks";
import { init_react_app_with_vite } from "./composite/init_react/init_react_app_with_vite";
import { ImmutableGenerator } from "./immutable_gen";
import { inject_sample_release_mix } from "./injectors/init_docker/inject_sample_release_mix";
import { appDataFromAppnNameSnake, setAppData } from "./readers/get_app_data";

setLogLevel(5);

const args = process.argv.slice(2);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: node init_proj.js <project_name>\n   Or: immutable -init <project_name>"
    );
    process.exit(1);
  }

  let projectName = args[0];

  projectName = projectName
    .toLowerCase()
    .replace(/[\s-]/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const AppData = appDataFromAppnNameSnake(projectName, false);
  setAppData(AppData);

  const {
    AppDir: appdir,
    LibDir: libdir,
    UiDir: uidir,
    WebDir: webdir,
    UmbrellaDir: umbrellaDir,
    AppNameSnake,
    AppNameCamel: projectNameCamel,
  } = AppData;
  const gen = {
    appName: { snake: AppNameSnake, camel: projectNameCamel },
    dir: { ProjectDir: umbrellaDir },
  } as unknown as ImmutableGenerator;
  await exec(
    { command: `mkdir -p ${AppNameSnake}_umbrella`, dir: "." },
    "init_proj"
  );

  setUmbrellaDirCache(umbrellaDir);

  log(
    { level: 1, color: "GREEN" },
    `\n\n Generating ${AppNameSnake} App with Immutable Stack\n\n`
  );
  await init_docker(gen);

  await init_phoenix_umbrella_app(AppData);

  await init_react_app_with_vite({
    projectName,
    projectNameCamel,
    appdir,
    uidir,
    webdir,
    libdir,
  });
  await build_tool_agnostic_init_tasks(AppData);
  await inject_sample_release_mix(gen);

  writeLog(umbrellaDir, `init_project_${projectName}`);

  const deps = await exec(
    {
      command: `mix deps.get`,
      dir: umbrellaDir,
    },
    "init_proj"
  );

  const compile = await exec(
    {
      command: `mix compile`,
      dir: umbrellaDir,
    },
    "init_proj"
  );

  log(
    { level: 1, color: "GREEN" },
    `\n\nInitialization Complete.\n\nGenerated ${projectName}_umbrella`
  );
}

main().catch(console.error);
