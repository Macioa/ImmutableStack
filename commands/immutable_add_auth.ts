import { add_auth } from "@/composite/add_auth";
import { getAppData, AppData } from "@/readers/get_app_data";
import { setUmbrellaDirCache, writeLog } from "@/utils/history_cache";
import { log, setLogLevel } from "@/utils/logger";

setLogLevel(3);

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length > 1) {
    console.error("Usage: immutable -add_auth [port]");
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
  const apiName = "auth";
  const apiAppName = `${AppNameSnake}_${apiName}`;

  log({ level: 1, color: "GREEN" }, `\n\n Generating Auth API: ${apiAppName}${port ? ` on port ${port}` : ""}\n\n`);

  const apiNameCamel =
    apiName.replace(/_([a-z])/g, g => g[1].toUpperCase()).replace(/^./, g => g.toUpperCase()) + "Web";

  const apiAppData = {
    ...appData,
    ApiNameSnake: apiName,
    ApiNameCamel: apiNameCamel,
    ApiPort: port,
  };

  setUmbrellaDirCache(UmbrellaDir);

  await add_auth(apiAppData);

  writeLog(UmbrellaDir, `add_auth_${apiName}`);

  log({ level: 1, color: "GREEN" }, `\n\nAuth API Generation Complete.\n\nGenerated ${apiAppName}\n`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});

