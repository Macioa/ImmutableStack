import { join } from "path";
import { log, setLogLevel } from "./utils/logger";
import { execute as exec } from "./runners";

import { setUmbrellaDirCache, writeLog } from "./utils/history_cache";

import { init_react_app_with_vite } from "./composite/init_react/init_react_app_with_vite";
import { build_tool_agnostic_init_tasks } from "./composite/init_react/build_tool_agnostic_init_tasks";
import { init_phoenix_umbrella_app } from "./composite/init_phoenix/init_phoenix_umbrella_app";

setLogLevel(5);

const args = process.argv.slice(2);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: node init_proj.js <project_name>\n   Or: immutable -init <project_name>",
    );
    process.exit(1);
  }

  let projectName = args[0];

  projectName = projectName
    .toLowerCase()
    .replace(/[\s-]/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const projectNameCamel = projectName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const currentDir = process.cwd(),
    umbrellaDir = join(currentDir, `${projectName}_umbrella`),
    appdir = join(umbrellaDir, "apps"),
    libdir = join(appdir, projectName),
    uidir = join(appdir, `${projectName}_ui`),
    webdir = join(appdir, `${projectName}_web`);
  setUmbrellaDirCache(umbrellaDir);

  log(
    { level: 1, color: "GREEN" },
    `\n\n Generating ${projectName} App with Immutable Stack\n\n`,
  );

  await init_phoenix_umbrella_app({
    projectName,
    projectNameCamel,
    umbrellaDir,
    libdir,
    webdir,
  });

  await init_react_app_with_vite({
    projectName,
    projectNameCamel,
    appdir,
    uidir,
    webdir,
    libdir,
  });
  await build_tool_agnostic_init_tasks({
    projectName,
    projectNameCamel,
    uidir,
    libdir,
  });

  writeLog(umbrellaDir, `init_project_${projectName}`);

  const deps = await exec(
    {
      command: `mix deps.get`,
      dir: umbrellaDir,
    },
    "init_proj",
  );

  const compile = await exec(
    {
      command: `mix compile`,
      dir: umbrellaDir,
    },
    "init_proj",
  );

  log(
    { level: 1, color: "GREEN" },
    `\n\nInitialization Complete.\n\nGenerated ${projectName}_umbrella`,
  );
  log({ level: 1, color: "BLUE" }, `    in ${currentDir}\n\n`);
}

main().catch(console.error);
