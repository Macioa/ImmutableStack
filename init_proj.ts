import { join } from "path";

import { execute as exec, executeAll as execAll } from "./runners";
import { log } from "./utils/logger";

import { gen_lorem_utils } from "./generators/gen_lorem_utils";
import { gen_react_config } from "./generators/gen_react_config";
import { gen_store } from "./generators/gen_store";

import { inject_app_declarations } from "./injectors/inject_app_declarations";
import { inject_dev_config } from "./injectors/inject_dev_config";
import { inject_phoenix_libs } from "./injectors/inject_phoenix_libs";
import { inject_redux_provider } from "./injectors/inject_redux_provider";
import { inject_web_endpoint } from "./injectors/inject_web_endpoint";
import { gen_request_lib } from "./generators/gen_request_lib";

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

  const projectNameCamel = projectName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  const currentDir = process.cwd(),
    umbrellaDir = join(currentDir, `${projectName}_umbrella`),
    appdir = join(umbrellaDir, "apps"),
    uidir = join(appdir, `${projectName}_ui`),
    webdir = join(appdir, `${projectName}_web`);

  log(
    { level: 1, color: "GREEN" },
    `\n\n Generating ${projectName} Umbrella App with Immutable Stack\n\n`
  );

  log({ level: 2, color: "BLUE" }, "\nGenerating Phoenix apps...");
  await exec({
    command: `mix phx.new ${projectName} --no-live --no-html --no-assets --binary-id --umbrella --install`,
    dir: ".",
  });
  await inject_app_declarations(projectName, umbrellaDir);
  await Promise.all([
    inject_phoenix_libs(projectName, {WebDir: webdir}),
    inject_web_endpoint(projectName, webdir),
    inject_dev_config(projectName, umbrellaDir),
  ]);

  log({ level: 2, color: "BLUE" }, "\nGenerating React app...");
  await exec({
    command: `npx create-react-app ${projectName}_ui --template typescript`,
    dir: appdir,
  });

  log(
    { level: 2, color: "BLUE" },
    "\nInstalling React libs and configuring app..."
  );
  const frontEndCommands = [
    "npm install @reduxjs/toolkit react-redux @types/react-redux",
    "npm install --save-dev @babel/plugin-transform-private-property-in-object",
    "npm install --save-dev lorem-ipsum",
    "npm install deepmerge",
    "npm install @mui/material @emotion/react @emotion/styled"
  ].map((c) => ({ command: c, dir: uidir }));
  await execAll(frontEndCommands);
  await Promise.all([
    gen_store(projectNameCamel, uidir),
    inject_redux_provider(projectNameCamel, uidir),
    gen_react_config(projectNameCamel, uidir),
    gen_lorem_utils(projectNameCamel, uidir),
    gen_request_lib(projectNameCamel, uidir),
  ]);

  log(
    { level: 1, color: "GREEN" },
    `\n\nInitialization Complete.\n\nGenerated ${projectName}_umbrella`
  );
  log({ level: 1, color: "BLUE" }, `    in ${currentDir}\n\n`);
}

main().catch(console.error);
