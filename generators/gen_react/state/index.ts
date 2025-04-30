import { randomUUID } from "crypto";
import { join } from "path";
import { GenTypes, ImmutableGenerator } from "../../../immutable_gen";
import { log } from "../../../utils/logger";
import { loremFunctions } from "../../../utils/lorem";
import { generateFile } from "../../index";
import { get_reducer_exports, get_reducers, mark_reducers } from "./reducers";
import {
  get_selector_exports,
  get_selectors,
  mark_selectors,
} from "./selectors";
import { generate_entity_state_tests } from "./test";

const gen_entity_store = async (
  generator: ImmutableGenerator,
  typeDict: GenTypes
) => {
  log({ level: 7 }, "GEN ENTITY STORE", generator);
  log({ level: 7 }, "TYPE DICT", typeDict);
  const { name, generate, LibDir } = generator;
  const { singleUpperCamel: entityNameSingleUpperCamel } = name;
  const { tstype, appstate, factory } = generate;
  const sliceName = generate.stateSlice?.name;
  const filedir = join(LibDir as string, "lib/typescript/state/");

  const typeSource = (typeDict.TsType || typeDict.ImmutableGlobal)?.["ts"];
  const stateSource = (typeDict.AppState || typeDict.ImmutableGlobal)?.["ts"];
  const initialStateSource = typeDict.InitialAppState?.["ts"] || {};

  const reducers = get_reducers(generator);
  const reducerExports = get_reducer_exports(reducers);
  const selectors = get_selectors(generator);
  const selectorExports = get_selector_exports(selectors || []);

  const typeKeys =
    "id: number;\n" +
    Object.keys(typeSource || {})
      .map((k) => `${k}: ${typeSource?.[k]}`)
      .join(";\n");
  const typeInit = `type ${tstype} = {${typeKeys}}`;
  const typeId = randomUUID();
  const type = `\n// ** IMMUTABLE ${name.singleUpperCamel} TYPEDEF ${typeId} **\n${typeInit}\n// ** IMMUTABLE ${name.singleUpperCamel} TYPEDEF ${typeId} **\n`;

  const stateKeys = Object.keys(stateSource || {})
    .map((k) => `${k}: ${stateSource?.[k]}`)
    .join(";\n");
  const stateid = randomUUID();
  const state = `\n// ** IMMUTABLE ${name.singleUpperCamel} APPSTATE ${stateid} **\ninterface ${appstate} {${stateKeys}}\n// ** IMMUTABLE ${name.singleUpperCamel} APPSTATE ${stateid} **\n`;

  const factoryFunKeys = Object.keys(typeSource || {})
    //@ts-ignore
    .map((k) => `${k}: ${loremFunctions(typeSource?.[k])}`)
    .join(",\n");
  const factoryFunInit = `const ${tstype}Factory = (params: object = {}): ${tstype} => {
    const ${entityNameSingleUpperCamel} = {${factoryFunKeys}};
    return Object.assign(${entityNameSingleUpperCamel}, params) as ${tstype};
}`;
  const factoryId = randomUUID();
  const factoryFun = `\n// ** IMMUTABLE ${name.singleUpperCamel} FACTORY ${factoryId} **\n${factoryFunInit}\n// ** IMMUTABLE ${name.singleUpperCamel} FACTORY ${factoryId} **\n`;

  const initialStateKeys = Object.keys(initialStateSource)
    .map((k) => `${k}: ${(initialStateSource as { [key: string]: any })[k]}`)
    .join(",\n");
  const initialStateInit = `const initial${appstate}State: ${entityNameSingleUpperCamel}StoreState = {${initialStateKeys}}`;
  const initialStateId = randomUUID();
  const initialState = `\n// ** IMMUTABLE ${name.singleUpperCamel} INITIAL STATE ${initialStateId} **\n${initialStateInit}\n// ** IMMUTABLE ${name.singleUpperCamel} INITIAL STATE ${initialStateId} **\n`;

  const Slice = `
const ${sliceName} = createSlice({
      name: "${entityNameSingleUpperCamel}",
      initialState: initial${appstate}State,
      reducers: {
        ${mark_reducers(get_reducers(generator))}
      },
    });
const ${entityNameSingleUpperCamel}Reducer = ${sliceName}.reducer;

${mark_selectors(selectors || [])?.join("\n")}
`;

  const exportVars = [
    appstate ? `initial${appstate}State` : null,
    factory ? `${tstype}Factory` : null,
    sliceName ? `${entityNameSingleUpperCamel}Reducer` : null,
    ...selectorExports,
  ]
    .filter((v) => !!v)
    .join(", ");

  const exports = [
    sliceName
      ? `const { ${reducerExports.join(
          ", "
        )} } = ${sliceName}.actions\nexport { ${reducerExports.join(", ")} }`
      : null,
    tstype || appstate
      ? `export type { ${[tstype, appstate, "GenericAppState"].join(", ")} }`
      : null,
    `export { ${exportVars} }`,
    sliceName ? `export default ${sliceName}` : null,
  ]
    .filter((v) => !!v)
    .join("\n");

  const genericAppStateInit = `
  interface GenericAppState {
    ${entityNameSingleUpperCamel}Store: ${entityNameSingleUpperCamel}StoreState;
    [key: string]: any;
}`;
const genericAppStateId = randomUUID();
  const genericAppState = `\n// ** IMMUTABLE ${name.singleUpperCamel} GENERIC APPSTATE ${genericAppStateId} **\n${genericAppStateInit}\n// ** IMMUTABLE ${name.singleUpperCamel} GENERIC APPSTATE ${genericAppStateId} **\n`;
  // ****** File Summary ******

  const content = `
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Lorem from "../utils/lorem";

${tstype ? `\n${type}\n` : ""}
${appstate ? `\n${state}\n` : ""}
${appstate ? `\n${initialState}\n` : ""}
${factory ? `\n${factoryFun}\n` : ""}
${sliceName ? `\n${Slice}\n` : ""}

${genericAppState}

${exports}
`;

  return Promise.all([
    generateFile(
      { dir: filedir, filename: `${entityNameSingleUpperCamel}.tsx`, content },
      "gen_entity_store"
    ),
    generate_entity_state_tests(generator, reducers, selectors || []),
  ]);
};

export { gen_entity_store, generate_entity_state_tests };
