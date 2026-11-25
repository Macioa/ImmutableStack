import { add_auth } from "@/composite/add_auth";
import { getAppData, AppData } from "@/readers/get_app_data";
import { setUmbrellaDirCache, writeLog } from "@/utils/history_cache";
import { log, setLogLevel } from "@/utils/logger";
import { applyPinnedVersions } from "@/utils/versions";
import { parseFlags, positionalArgs } from "@/utils/flags";
import { run_command, start_quick_mode } from "@/utils/quick";
import { resolve_api_port } from "@/injectors/add_api/inject_api_to_dev_config";

setLogLevel(3);
applyPinnedVersions(__dirname);

const main = async () => {
  const argv = process.argv.slice(2);
  const { quick } = parseFlags(argv);
  const args = positionalArgs(argv);

  if (args.length > 1) {
    console.error("Usage: immutable -add_auth [port] [-quick]");
    console.error("Example: immutable -add_auth");
    console.error("Example: immutable -add_auth 5001");
    process.exit(1);
  }

  const portArg = args[0];
  const port = portArg ? parseInt(portArg, 10) : undefined;

  if (port && (isNaN(port) || port < 1024 || port > 65535)) {
    console.error(`Invalid port: ${portArg}. Port must be between 1024 and 65535.`);
    process.exit(1);
  }

  const appData = (await getAppData()) as AppData | null;

  if (!appData) {
    console.error(
      "Could not find umbrella project. Please run this command from the umbrella root directory."
    );
    process.exit(1);
  }

  const { AppNameSnake, UmbrellaDir } = appData;
  start_quick_mode(AppNameSnake, "add_auth", { quick });
  const apiName = "auth";
  const apiAppName = `${AppNameSnake}_${apiName}`;

  log({ level: 1, color: "GREEN" }, `\n\n Generating Auth API: ${apiAppName}${port ? ` on port ${port}` : ""}\n\n`);

  const apiNameCamel =
    apiName.replace(/_([a-z])/g, g => g[1].toUpperCase()).replace(/^./, g => g.toUpperCase()) + "Web";

  const apiAppData = resolve_api_port({
    ...appData,
    ApiNameSnake: apiName,
    ApiNameCamel: apiNameCamel,
    ApiPort: port,
  });

  setUmbrellaDirCache(UmbrellaDir);

  await run_command(async () => {
    await add_auth(apiAppData);
    writeLog(UmbrellaDir, `add_auth_${apiName}`);
  });

  log({ level: 1, color: "GREEN" }, `\n\nAuth API Generation Complete.\n\nGenerated ${apiAppName}\n`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});

