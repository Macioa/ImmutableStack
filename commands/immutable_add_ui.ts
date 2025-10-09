import { fetch_assets } from "@/assets";
import { build_tool_agnostic_init_tasks } from "@/composite/init_react/build_tool_agnostic_init_tasks";
import { init_react_app_with_vite } from "@/composite/init_react/init_react_app_with_vite";
import { getAppData } from "@/readers/get_app_data";
import { execute as exec } from "@/runners";
import { writeLog } from "@/utils/history_cache";
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

  const _react = await init_react_app_with_vite(AppData, uiName);
  const _assets = await fetch_assets(AppData, uiName);
  const _build_tools = await build_tool_agnostic_init_tasks(AppData, uiName);

  writeLog(UmbrellaDir, `add_ui_${uiName}`);
  
  log(
    { level: 1, color: "BLUE" },
    `\n\n Installing React dependencies for ${AppNameSnake}_${uiName}...\n\n`
  );
  
  const _deps = await exec(
    {
      command: `npm install`,
      dir: `${UmbrellaDir}/apps/${AppNameSnake}_${uiName}`,
    },
    "add_ui"
  );

  log(
    { level: 1, color: "GREEN" },
    `\n\n✓ New UI added successfully: ${AppNameSnake}_${uiName}\n\n` +
    `Next steps:\n` +
    `  1. Update your Phoenix router to serve this UI on a specific path\n` +
    `  2. Run 'mix compile' from the project root\n` +
    `  3. Start your server with 'mix phx.server'\n\n` +
    `The new UI will be available at apps/${AppNameSnake}_${uiName}/\n`
  );
}

main().catch(console.error);

