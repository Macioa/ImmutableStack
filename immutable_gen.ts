import * as path from "path";

import { setUmbrellaDirCache, writeLog } from "./utils/history_cache";
import { log, setLogLevel } from "./utils/logger";
import { Names } from "./utils/string";

import { readGenFile } from "./readers/genfile";
import { handle_phx_gen } from "./generators/gen_phoenix/phx_gen_handler";
import { gen_entity_store } from "./generators/gen_react/gen_entity_store";
import { addReducerToGlobal } from "./injectors/gen_react/add_reducer_to_global";
import { gen_entity_requests } from "./generators/gen_react/gen_entitiy_requests";

setLogLevel(5);

type ImmutableGenerator = {
  name: Names;
  appName: {
    camel: string;
    snake: string;
  };
  dir: {
    ProjectDir?: string;
    AppDir?: string;
    LibDir?: string;
    UiDir?: string;
    WebDir?: string;
  };
  generate: {
    requests?: ImmutableRequests;
    stateSlice?: ImmutableStateSlice;
    http_controller?: ImmutableController;
    channel_controller?: string;
    context?: ImmutableContext;
    databaseTable?: string;
    schema?: string;
    tstype?: string;
    appstate?: string;
    factory?: boolean;
  };
  test?: boolean;

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

interface ImmutableStateSlice {
  name: string;
  reducers?: string[];
  selectors?: string[];
}

interface ImmutableRequests {
  requestFunctions: string[];
}

interface Dict {
  [key: string]: string | Dict;
}

interface TypeDict {
  name?: string | null;
  ts: Dict;
  ex: Dict;
}

enum GenTypesKey {
  ImmutableGlobal = "ImmutableGlobal",
  AppState = "AppState",
  InitialAppState = "InitialAppState",
  TransitoryState = "TransitoryState",
  Schema = "Schema",
  DatabaseTable = "DatabaseTable",
  TsType = "TsType",
}

type GenTypes = { [key in GenTypesKey]?: TypeDict };

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
  GenTypesKey,
  ImmutableGenerator,
  ImmutableContext,
  ImmutableController,
  Names,
};
