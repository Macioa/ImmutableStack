/*
** Immutable Generator **
    Generate elixir and react code from a genfile
      - requires a genfile path as an argument
*/

import * as path from "path";
import { gen_phx } from "./composite/gen_phoenix";
import { gen_react } from "./composite/gen_react";
import { readGenFile } from "./readers/genfile";
import { AppData } from "./readers/get_app_data";
import { setUmbrellaDirCache, writeLog } from "./utils/history_cache";
import { log, setLogLevel } from "./utils/logger";
import { Names } from "./utils/string";

setLogLevel(5);

type ImmutableGenerator = {
  name: Names;
  AppData: AppData;
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
    test?: boolean;
    demoComponents?: boolean;
  };

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

  log({ level: 1, color: "GREEN" }, `\n\n Reading genfile...\n\n`);
  const { generator, genTypes } = await readGenFile(filePath);
  const {
    name: { pluralUpperCamel, singleSnake },
    AppData: { AppNameCaps, UmbrellaDir },
  } = generator;
  setUmbrellaDirCache(UmbrellaDir);

  log({ level: 1, color: "BLUE" }, `\nGenerating front end components...`);
  await gen_react(generator, genTypes);

  log({ level: 1, color: "BLUE" }, `\nGenerating server components...`);
  await gen_phx(generator, genTypes);

  writeLog(UmbrellaDir, `generate_${singleSnake}`);

  log(
    { level: 1, color: "GREEN" },
    `\n\Generation Complete.\n\nGenerated ${pluralUpperCamel}\n`
  );
  log({ level: 1, color: "TEAL" }, `    in ${AppNameCaps} App\n\n`);
  log(
    { level: 2, color: "YELLOW" },
    "\nDon't forget to update your repository by running migrations:"
  );
  log({ level: 4, color: "BLUE" }, `    yarn d.mig\n`);
  log({ level: 4, color: "BLUE" }, `          or\n`);
  log({ level: 4, color: "BLUE" }, `    mix ecto.migrate\n`);
};

main().catch(console.error);

export type {
  Dict,
  GenTypes,
  GenTypesKey,
  ImmutableContext,
  ImmutableController,
  ImmutableGenerator,
  Names,
  TypeDict,
};
