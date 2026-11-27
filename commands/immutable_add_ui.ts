import { fetch_assets } from "@/assets";
import { gen_gitignore_react } from "@/generators/init_configs/gen_gitignore_react";
import { build_tool_agnostic_init_tasks_for_add_ui } from "@/composite/add_ui/build_tool_agnostic_init_tasks_for_add_ui";
import { init_react_app_for_add_ui } from "@/composite/add_ui/init_react_app_for_add_ui";
import { add_auth_to_ui, has_auth_ui } from "@/injectors/add_auth";
import { getAppData } from "@/readers/get_app_data";
import { join } from "@/utils/path";
import { execute as exec } from "@/runners";
import { log, setLogLevel } from "@/utils/logger";
import { applyPinnedVersions } from "@/utils/versions";
import { parseFlags, positionalArgs } from "@/utils/flags";
import { run_command, start_quick_mode } from "@/utils/quick";
import { timed } from "@/utils/profile";
import { DEFAULT_CACHE_DIR, uses_dep_cache } from "@/utils/dep_cache";

setLogLevel(5);
applyPinnedVersions(__dirname);

const argv = process.argv.slice(2);
const { quick } = parseFlags(argv);
const args = positionalArgs(argv);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: immutable -add_ui <ui_name> [-quick]\n\nExample: immutable -add_ui admin"
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
  start_quick_mode(AppNameSnake, "add_ui", { quick });
  // Projects initialized with -cache reuse the cache for assets and create-vite
  const cached = uses_dep_cache(AppData);

  log(
    { level: 1, color: "GREEN" },
    `\n\n Adding new UI: ${AppNameSnake}_${uiName}\n\n`
  );

  await run_command(async () => {
    const _react = await timed("scaffold + configure ui", () =>
      init_react_app_for_add_ui(AppData, uiName, { offline: cached })
    );
    const _assets = await timed("assets", () =>
      fetch_assets(AppData, uiName, { cacheDir: cached ? DEFAULT_CACHE_DIR : undefined })
    );
    const _build_tools = await timed("ui build tools", () => build_tool_agnostic_init_tasks_for_add_ui(AppData, uiName));
    const _gitignore = await gen_gitignore_react(AppData, uiName);

    log(
      { level: 2, color: "BLUE" },
      `\n\n Installing React dependencies from centralized apps/package.json...\n\n`
    );

    const _deps = await timed("pnpm install", () =>
      exec(
        {
          command: `pnpm install`,
          dir: `${UmbrellaDir}/apps`,
        },
        "add_ui"
      )
    );

    // Projects that already ran add_auth get the sign in menu in the new UI too
    const _auth = await timed("auth ui wiring", async () =>
      has_auth_ui(AppData)
        ? await add_auth_to_ui(join(AppData.AppDir, `${AppNameSnake}_${uiName}`), AppData)
        : []
    );
  });

  log(
    { level: 2, color: "GREEN" },
    `\n\nNew UI added: ${AppNameSnake}_${uiName}\n\n`
  );
}

main().catch(console.error);
