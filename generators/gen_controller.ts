import * as fs from "fs";
import * as path from "path";
import pluralize from "pluralize";

import { getAppData } from "../readers/get_app_data";
import { handle_phx_gen } from "./phx_gen_handler";
import { gen_entity_store } from "./gen_entity_store";
import { log, setLogLevel } from "../utils/logger";
import { addReducerToGlobal } from "../injectors/add_reducer_to_global";
import { gen_entity_requests } from "./gen_entitiy_requests";

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
  TransitoryState?: TypeDict
  Schema?: TypeDict;
  DatabaseModel?: TypeDict;
  TsType?: TypeDict;
}

const getGenTypes = (
  fileContent: string,
  typeDict: { [key: string]: string },
  mem: Dict = {}
): Dict => {
  fileContent
    .match(/interface (\w+).*?extends GenType<.*?> \{\}/gs)
    ?.map((match: string) => interperetType(match, typeDict))
    .forEach(({ name, ts, ex }) => {
      const hasTs = Object.keys(ts || {}).length > 0,
        hasEx = Object.keys(ex || {}).length > 0;
      if (name && hasTs && hasEx) mem[name] = { ts, ex };
    });
  return mem;
};

const interperetType = (
  str: string,
  dict: Dict,
  mem: TypeDict = { name: null, ts: {}, ex: {} }
): TypeDict => {
  const name = str.match(/interface\s(\w+)/)?.[1];
  const attr_reg = /([a-zA-Z0-9_\[\]]+):([a-zA-Z\s\|0-9_\[\]]+){0,20}/gs;
  Object.assign(mem, { name: name });
  str.replace(attr_reg, (match, k, v) => {
    v = v.trim();
    mem.ex[k] = v;
    mem.ts[k] = dict[v] || v;
    return match;
  });
  return mem;
};

const getTypeEquivalents = (
  file: string,
  mem: { [key: string]: string } = {}
): { [key: string]: string } => {
  const type_reg = /type\s(\w+)\s=\s(\w+)\s&\s\{\s__brand\:/gs;
  file.replace(type_reg, (f: string, ex: string, ts: string) => {
    mem[ex] = ts;
    return f;
  });
  return mem;
};

const getGenerator = (file: string): object => {
  const gen_reg =
    /Immutable\s\:\sImmutableGenerator\s=([\s\S]*?)\/\*.*DECLARATIONS/;
  const gen_data = file
    .match(gen_reg)?.[1]
    .replace(/(\w+):/g, '"$1":')
    ?.replace(/,\s*\}/gs, "}")
    ?.replace(/\/\/([\w ,.]+)/g, "") || "{}";
  log({ level: 8 }, "Found generator data: ", gen_data);
  
  const keys_negated = gen_data.replace(
    /\"([\w]+)\"\:/g,
    (_match, key) => `Q_HLD${key}Q_HLD:`
  );
  log({ level: 9 }, "Negated keys: ", keys_negated);
  const double_escape = keys_negated.replace(/\\/g, '\\\\');
  log({level: 9}, "Doubled escape chars: ", double_escape)
  const escaped_inner_quotes = double_escape.replace(
    /(['`\"])(.*)(\".*\")(.*)(['`\"])/g,
    (_match, openQuote, preceeding, innerQuote, trailing, closeQuote) => {
      const inner =
        openQuote == closeQuote ? innerQuote.replace(/\"/g, '\\"') : innerQuote;
      return `${openQuote}${preceeding}${inner}${trailing}${closeQuote}`;
    }
  );
  log({ level: 9 }, "Escaped inner quotes: ", escaped_inner_quotes);
  const single_quotes_turned_double = escaped_inner_quotes.replace(
    /[\'\`]/g,
    '"'
  );
  log({ level: 9 }, "Single quotes turned double: ", single_quotes_turned_double);
  const keys_restored = single_quotes_turned_double.replace(/Q_HLD/g, '"');
  log({ level: 9 }, "Restored keys: ", keys_restored);


  log({ level: 3, color: "GREEN" }, "Generating from: ");
  log({ level: 3, color: "YELLOW" }, keys_restored);
  const gen = JSON.parse(keys_restored);
  return gen;
};

const computeGenNames = ({
  name,
}: ImmutableGenerator): {
  name: string;
  pluralName: string;
  camelName: string;
} => {
  log({ level: 9 }, "Computing names for: ", name);
  const pluralizeSnakeCase = (str: string): string => {
    const parts = str.split("_");
    const lastPartPlural = pluralize(parts.pop() || "");
    return [...parts, lastPartPlural].join("_");
  };
  const camelName = name
    .split("_")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
  const pluralName = pluralizeSnakeCase(name);
  log({ level: 6 }, "Computed names: ", { name, pluralName, camelName });
  return { name, pluralName, camelName };
};

const main = async () => {
  const args = process.argv.slice(2);
  const filePath = path.resolve(args[0]);
  if (args.length < 1) {
    console.error("Please provide the input file path as an argument.");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, "utf8");

  log({ level: 1, color: "GREEN" }, `\n\n Generating from genfile...\n\n`);

  log(
    { level: 3, color: "BLUE" },
    `\nReading genfile: ${path.resolve(args[0])}`
  );
  log({ level: 5 }, "Analyzing types...");
  const typeDict = getTypeEquivalents(fileContent);
  log({ level: 5 }, "Reading generator...");

  const genFileParsed = (await getGenerator(
    fileContent
  )) as unknown as ImmutableGenerator;
  const generator = {
    ...(await getAppData()),
    ...genFileParsed,
    ...computeGenNames(genFileParsed),
  } as unknown as ImmutableGenerator;
  log({ level: 3 }, "Generator: ", generator);

  const genTypes = getGenTypes(fileContent, typeDict);
  log({ level: 5 }, "Generated types: ", genTypes);

  log({ level: 2, color: "BLUE" }, `\nGenerating server components...`);
  log({ level: 3 }, await handle_phx_gen(generator, genTypes));

  log({ level: 2, color: "BLUE" }, `\nGenerating front end components...`);
  log({ level: 3 }, addReducerToGlobal(generator));
  log({ level: 3 }, await gen_entity_store(generator, genTypes));
  log({ level: 3 }, await gen_entity_requests(generator, genTypes));
};

main().catch(console.error);

export {
  Dict,
  TypeDict,
  GenTypes,
  ImmutableGenerator,
  ImmutableContext,
  ImmutableController,
};
