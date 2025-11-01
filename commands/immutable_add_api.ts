import { add_api } from "@/composite/add_api";
import { getAppData, AppData } from "@/readers/get_app_data";
import { setUmbrellaDirCache, writeLog } from "@/utils/history_cache";
import { log, setLogLevel } from "@/utils/logger";
import { execute as exec } from "@/runners";

setLogLevel(3);

const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error("Usage: immutable -add_api <api_name> [port]");
    console.error("Example: immutable -add_api web2");
    console.error("Example: immutable -add_api admin 5000");
    process.exit(1);
  }

  const apiName = args[0].toLowerCase().replace(/[^a-z0-9_]/g, "");
  const port = args[1] ? parseInt(args[1]) : undefined;
  
  if (port && (isNaN(port) || port < 1024 || port > 65535)) {
    console.error(`Invalid port: ${args[1]}. Port must be between 1024 and 65535.`);
    process.exit(1);
  }

  const appData = await getAppData() as AppData;
  if (!appData) {
    console.error("Could not find umbrella project. Please run this command from the umbrella root directory.");
    process.exit(1);
  }

  const { AppNameSnake, UmbrellaDir } = appData;
  const apiAppName = `${AppNameSnake}_${apiName}`;
  
  log({ level: 1, color: "GREEN" }, `\n\n Generating Web API: ${apiAppName}${port ? ` on port ${port}` : ''}\n\n`);
  
  const apiNameCamel = apiName.replace(/_([a-z])/g, (g) => g[1].toUpperCase()).replace(/^./, (g) => g.toUpperCase());
  const apiAppData = {
    ...appData,
    ApiNameSnake: apiName,
    ApiNameCamel: `${apiNameCamel}Web`,
    ApiPort: port,
  };

  setUmbrellaDirCache(UmbrellaDir);

  await add_api(apiAppData);

  writeLog(UmbrellaDir, `add_api_${apiName}`);

  log({ level: 1, color: "GREEN" }, `\n\nWeb API Generation Complete.\n\nGenerated ${apiAppName}\n`);
};

main().catch(console.error);

