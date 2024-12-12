import { Dict, TypeDict, GenTypes, GenTypesKey } from "../../immutable_gen";
import { log } from "../../utils/logger";

const readAllTypes = (fileContent: string, dict: Dict): GenTypes => ({
  ...getGenTypes(fileContent, dict),
  ...getInitialAppState(fileContent),
});

const getGenTypes = (fileContent: string, dict: Dict): GenTypes => {
  const interfaces: GenTypes = {};
  fileContent.replace(
    /(interface\s+)(\w+)(\s+extends\s+GenType\<\{\s+)([^\>]*?)(\s+\}\>\s*\{\})/g,
    (_m, _i, name, _d, definition) => {
      log({ level: 9 }, "Found Type: ", { name, definition });
      const { ex, ts }: TypeDict = interperetType(name, definition, dict);
      const has_properties =
        !!Object.keys(ts).length || !!Object.keys(ex).length;
      if (has_properties) interfaces[name as GenTypesKey] = { name, ts, ex };
      return "";
    }
  );

  return interfaces;
};

const getInitialAppState = (fileContent: string): GenTypes => {
  const interfaces: GenTypes = {};
  fileContent.replace(
    /(interface\s+)(InitialAppState)(\s+extends\s+AppState\s*\{\s*)([^\>]*?)(\s*\}\s+\w+)/g,
    (_m, _i, _a, _d, definition) => {
      log({ level: 9 }, "Found InitalState: ", { definition });
      const { ex, ts }: TypeDict = interperetType(
        "InitialAppState",
        definition
      );
      const has_properties =
        !!Object.keys(ts).length || !!Object.keys(ex).length;
      if (has_properties) interfaces.InitialAppState = { name: "InitialAppState", ts, ex };
      return "";
    }
  );

  return interfaces;
};

const interperetType = (
  name: string,
  definition: string,
  dict: Dict = {}
): TypeDict => {
  const definitionList: { key: string; value: string }[] = [];
  const sanitized = definition
    .replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "") // Remove comments
    .replace(/[;,]\s*(?=$)/gm, "") // Remove trailing semicolons and commas
    .trim();
  // extract key value pairs
  sanitized.replace(/^\s*\"?(\w+)\"?\s*:\s*(.*?)\s*$/gm, (_, key, value) => {
    value = value.trim();
    log({ level: 8 }, { key, value });
    definitionList.push({ key, value });
    return "";
  });

  const type: TypeDict = definitionList.reduce(
    (acc, { key, value }) =>
      Object.assign(acc, {
        ex: { ...acc.ex, [key]: value },
        ts: { ...acc.ts, [key]: dict[value] || value },
      }),
    { name, ts: {}, ex: {} }
  );
  log({ level: 6 }, "Parsed Type: ", type);
  return type;
};

const getTypeEquivalents = (
  file: string,
  mem: { [key: string]: string } = {}
): { [key: string]: string } => {
  const type_reg = /type\s(\w+)\s=\s(\w+)\s&\s\{\s__brand\:/gs;
  file.replace(type_reg, (f: string, ex: string, ts: string) => {
    mem[ex] = ts;
    return "";
  });
  return mem;
};

export { getGenTypes, getTypeEquivalents, getInitialAppState, readAllTypes };
