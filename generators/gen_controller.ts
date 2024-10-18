import * as fs from "fs";
import * as path from "path";

import { getAppData } from "../readers/get_app_data";
import { handle_phx_gen } from "./phx_gen_handler";
import { gen_entity_store } from "./gen_entity_store";
import { log, setLogLevel } from "../utils/logger";
import { addReducerToGlobal } from "../injectors/add_reducer_to_global";
import { gen_entity_requests } from "./gen_entitiy_requests";
import { execute } from "../runners";

setLogLevel(9)

type ImmutableGenerator = {
  name: string;
  generate: {
    slice?: string;
    http_controller?: string;
    channel_controller?: string;
    databaseModel?: string;
    context?: string;
    schema?: string;
    tstype?: string;
    appstate?: string;
    factory?: boolean;
    initialstate?: object;
  };
  test: boolean;
  [key: string]: any;
};

interface Dict {
  [key: string]: string | Dict;
}

interface TypeDict {
  name: string | null;
  ts: Dict;
  ex: Dict;
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
  console.log("interpet type receives :",mem);
  const name = str.match(/interface\s(\w+)/)?.[1];
  const attr_reg = /([a-zA-Z0-9_\[\]]+):([a-zA-Z\s\|0-9_\[\]]+){0,20}/gs;
  Object.assign(mem, { name: name });
  str.replace(attr_reg, (match, k, v) => {
    v = v.trim();
    mem.ex[k] = v;
    mem.ts[k] = dict[v] || v;
    return match;
  });
  console.log("interpet type returns :",mem);
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
  const gen = file
    .match(gen_reg)?.[1]
    .replace(/(\w+):/g, '"$1":')
    ?.replace(/,\s*\}/gs, "}")
    ?.replace(/\/\/([\w ,.]+)/g, "");
  log({level: 6}, "Generating from: ", gen || {})
  return JSON.parse(gen || "{}");
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Please provide the input file path as an argument.");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(path.resolve(args[0]), "utf8");
  const appData = await getAppData();
  
  log(
    { level: 1, color: "GREEN" },
    `\n\n Generating from genfile...\n\n`
  );

  log({level: 3, color: 'BLUE'}, `\nReading genfile: ${path.resolve(args[0])}`);
  log({level: 5}, "Analyzing types...");
  const typeDict = getTypeEquivalents(fileContent);
  log({level: 5}, "Reading generator...");
  const gen = Object.assign(getGenerator(fileContent), appData) as unknown as ImmutableGenerator;
  const mem = getGenTypes(fileContent, typeDict);
  log({level: 8}, gen, mem);

  log({level: 2, color: "BLUE"}, `\nGenerating server components...`);
  log({level: 3}, await handle_phx_gen(gen, mem));

  log({level: 2, color: "BLUE"}, `\nGenerating front end components...`);
  log({level: 3}, addReducerToGlobal(gen));
  log({level: 3}, await gen_entity_store(gen, mem));
  log({level: 3}, await gen_entity_requests(gen, mem));

};

main().catch(console.error);

export { Dict, TypeDict, ImmutableGenerator };
