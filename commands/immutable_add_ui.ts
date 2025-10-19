import { fetch_assets } from "@/assets";
import { build_tool_agnostic_init_tasks_for_add_ui } from "@/composite/add_ui/build_tool_agnostic_init_tasks_for_add_ui";
import { init_react_app_for_add_ui } from "@/composite/add_ui/init_react_app_for_add_ui";
import { getAppData } from "@/readers/get_app_data";
import { execute as exec } from "@/runners";
import { log, setLogLevel } from "@/utils/logger";

setLogLevel(5);

const args = process.argv.slice(2);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: immutable -add_ui <ui_name>\n\nExample: immutable -add_ui admin"
    );
    process.exit(1);
  }

  let uiName = args[0]
    .toLowerCase()
    .replace(/[\s-]/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const AppData = await getAppData();
  
  if (!AppData) {
    console.error(
      "Error: Could not find mix.exs in current directory.\n" +
      "Please run this command from the root of your Phoenix umbrella project."
    );
    process.exit(1);
  }

  const { AppNameSnake, UmbrellaDir } = AppData;

  log(
    { level: 1, color: "GREEN" },
    `\n\n Adding new UI: ${AppNameSnake}_${uiName}\n\n`
  );

  const _react = await init_react_app_for_add_ui(AppData, uiName);
  const _assets = await fetch_assets(AppData, uiName);
  const _build_tools = await build_tool_agnostic_init_tasks_for_add_ui(AppData, uiName);
  
  log(
    { level: 1, color: "BLUE" },
    `\n\n Installing React dependencies from centralized apps/package.json...\n\n`
  );
  
  const _deps = await exec(
    {
      command: `npm install`,
      dir: `${UmbrellaDir}/apps`,
    },
    "add_ui"
  );

  log(
    { level: 1, color: "GREEN" },
    `\n\nNew UI added: ${AppNameSnake}_${uiName}\n\n`
  );
}

main().catch(console.error);

