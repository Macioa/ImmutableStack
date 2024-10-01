import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { gen_store } from "./generators/gen_store";
import { inject_redux_provider } from "./injectors/inject_redux_provider";
import { inject_router } from "./injectors/inject_router";

const args = process.argv.slice(2);

if (args.length < 1) {
  console.error("Usage: node init_proj.js <project_name>");
  process.exit(1);
}

let projectName = args[0];

projectName = projectName
  .toLowerCase()
  .replace(/[\s-]/g, "_")
  .replace(/[^a-z0-9_]/g, "");

const projectNameCamel = projectName
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

const umbrellaDir = `${projectName}_umbrella`,
  appdir = path.join(umbrellaDir, "apps"),
  uidir = path.join(appdir, `${projectName}_ui`),
  webdir = path.join(appdir, `${projectName}_web`)

console.log("\nGenerating Phoenix apps...");
execSync(
  `mix phx.new ${projectName} --no-live --no-html --no-assets --binary-id --umbrella --install`,
  { stdio: "inherit" }
);

// Modify mix.exs to add apps: [projectName, `${projectName}_web`] underneath apps_path
const mixExsPath = path.join(`${projectName}_umbrella`, "mix.exs");
let mixExsContent = fs.readFileSync(mixExsPath, "utf8");
mixExsContent = mixExsContent.replace(
  /apps_path: "apps"/,
  `apps_path: "apps",\n  apps: [:${projectName}, :${projectName}_web]`
);
fs.writeFileSync(mixExsPath, mixExsContent, "utf8");
execSync(`cd ${projectName}_umbrella && mix format mix.exs`, {
  stdio: "inherit",
});

console.log("\nGenerating React app...");
execSync(
  `cd ${appdir} && npx create-react-app ${projectName}_ui --template typescript`,
  { stdio: "inherit" }
);
console.log("\nInstalling Redux...");

execSync(
  `cd ${uidir} && npm install @reduxjs/toolkit react-redux @types/react-redux`,
  { stdio: "inherit" }
);
execSync(
  `cd ${uidir} && npm install --save-dev @babel/plugin-proposal-private-property-in-object`,
  { stdio: "inherit" }
);
gen_store(projectNameCamel, uidir);
inject_redux_provider(projectNameCamel, uidir);
