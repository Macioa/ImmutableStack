import { match } from "assert";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

interface Dict {
  [key: string]: string | Dict;
}

interface Mem {
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
      name && hasTs && hasEx ? (mem[name] = { ts, ex }) : null;
    });
  return mem;
};

const interperetType = (
  str: string,
  dict: Dict,
  mem: Mem = { name: null, ts: {}, ex: {} }
): Mem => {
  const name = str.match(/interface\s(\w+)/);
  const attr_reg = /(\w+):\s(\w+)/gs;
  Object.assign(mem, { name: name?.[1] });
  str.replace(attr_reg, (match, k, v) => {
    mem.ex[k] = v;
    mem.ts[k] = dict[v];
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
  const gen = file
    .match(gen_reg)?.[1]
    .replace(/(\w+):/g, '"$1":')
    ?.replace(/,\s*\}/gs, "}");
  return JSON.parse(gen || "{}");
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Please provide the input file path as an argument.");
    process.exit(1);
  }

  const fileContent = fs.readFileSync(path.resolve(args[0]), "utf8");

  const typeDict = getTypeEquivalents(fileContent);
  const gen = getGenerator(fileContent);
  const mem = getGenTypes(fileContent, typeDict);

  console.log(gen, mem);
};

main().catch(console.error);
