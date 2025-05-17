import { gen_channel_demo_component } from "./generators/gen_channel/gen_demo_component";
import { gen_phx_channel } from "./generators/gen_channel/gen_phx_channel";
import { gen_react_channel } from "./generators/gen_channel/gen_react_channel";
import { inject_channel_to_socket } from "./injectors/gen_channel/inject_channel_to_socket";
import { AppData, getAppData } from "./readers/get_app_data";
import { setUmbrellaDirCache, writeLog } from "./utils/history_cache";
import { log, setLogLevel } from "./utils/logger";
import { getNamesFromSingularSnakeCase, Names } from "./utils/string";

setLogLevel(5);

const main = async () => {
  const args = process.argv.slice(2);
  const name = getNamesFromSingularSnakeCase(args[0]) as Names;
  const appdata = await getAppData() as AppData;
  if (args.length < 1) {
    console.error("Please provide a channel name as an argument.");
    process.exit(1);
  }
  setUmbrellaDirCache(appdata.UmbrellaDir);

  log({ level: 1, color: "GREEN" }, `\n\n Generating ${name.singleSnake} Channel...\n\n`);

  const operations = await Promise.all([
    gen_phx_channel(name, appdata),
    gen_react_channel(name, appdata),
    inject_channel_to_socket(name, appdata),
    gen_channel_demo_component(name, appdata),
  ]);

  writeLog(appdata.UmbrellaDir, `generate_${name.singleSnake}_channel`);
  log({ level: 1, color: "GREEN" }, `\n\n ${name.singleUpperCamel} Channel Complete\n\n`);
};

main().catch(console.error);
