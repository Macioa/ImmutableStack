import * as path from "path";

import { setUmbrellaDirCache, writeLog } from "../utils/history_cache";
import { log, setLogLevel } from "../utils/logger";

import { readGenFile } from "../readers/genfile_reader";
import { handle_phx_gen } from "./gen_phoenix/phx_gen_handler";
import { gen_entity_store } from "./gen_react/gen_entity_store";
import { addReducerToGlobal } from "../injectors/gen_react/add_reducer_to_global";
import { gen_entity_requests } from "./gen_react/gen_entitiy_requests";

setLogLevel(5);

type ImmutableGenerator = {
  name: string;
  camelName?: string;
  pluralName?: string;
  generate: {
    slice?: string;
    http_controller?: ImmutableController;
    channel_controller?: string;
    databaseModel?: string;
    context?: ImmutableContext;
    schema?: string;
    tstype?: string;
    appstate?: string;
    factory?: boolean;
    initialstate?: object;
  };
  test: boolean;
  AppNameCamel?: string;
  AppNameSnake?: string;
  ProjectDir?: string;
  AppDir?: string;
  LibDir?: string;
  UiDir?: string;
  WebDir?: string;
  [key: string]: any;
};

interface ImmutableContext {
  name: string;
  apiFunctions: string[];
}

interface ImmutableController {
  name: string;
  routes: string[];
}

interface Dict {
  [key: string]: string | Dict;
}

interface TypeDict {
  name?: string | null;
  ts: Dict;
  ex: Dict;
}

interface GenTypes {
  ImmutableGlobal?: TypeDict;
  AppState?: TypeDict;
  InitialAppState?: TypeDict;
  TransitoryState?: TypeDict;
  Schema?: TypeDict;
  DatabaseModel?: TypeDict;
  TsType?: TypeDict;
}

const main = async () => {
  const args = process.argv.slice(2);
  const filePath = path.resolve(args[0]);
  if (args.length < 1) {
    console.error("Please provide the input file path as an argument.");
    process.exit(1);
  }

  log({ level: 1, color: "GREEN" }, `\n\n Generating from genfile...\n\n`);
  const { generator, genTypes } = await readGenFile(filePath);
  setUmbrellaDirCache(generator.UmbrellaDir || "./");

  log({ level: 2, color: "BLUE" }, `\nGenerating server components...`);
  log({ level: 3 }, await handle_phx_gen(generator, genTypes));

  log({ level: 2, color: "BLUE" }, `\nGenerating front end components...`);
  log({ level: 3 }, addReducerToGlobal(generator));
  log({ level: 3 }, await gen_entity_store(generator, genTypes));
  log({ level: 3 }, await gen_entity_requests(generator, genTypes));

  writeLog(generator.UmbrellaDir || "./", `generate_${generator.name}`);
};

main().catch(console.error);

export type {
  Dict,
  TypeDict,
  GenTypes,
  ImmutableGenerator,
  ImmutableContext,
  ImmutableController,
};
