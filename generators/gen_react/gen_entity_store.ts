import { join } from "path";
import { ImmutableGenerator } from "../gen_controller";
import pluralize from "pluralize";
import { loremFunctions } from "../../utils/lorem";
import { generateFile } from "../index";
import { log } from "../../utils/logger";

const gen_entity_store = async (
  generator: ImmutableGenerator,
  typeDict: any
) => {
  log({ level: 7 }, "GEN ENTITY STORE", generator);
  log({ level: 7 }, "TYPE DICT", typeDict);
  const { name, generate, LibDir, UiDir, AppNameCamel } = generator;
  const { tstype, appstate, factory, slice } = generate;
  const filedir = join(LibDir as string, "lib/typescript/state/");

  const capName = name.charAt(0).toUpperCase() + name.slice(1);
  const typeSource = (typeDict.TsType || typeDict.ImmutableGlobal)["ts"];
  const stateSource = (typeDict.AppState || typeDict.ImmutableGlobal)["ts"];
  const initialStateSource = typeDict.InitialAppState?.["ts"] || {};

  const typeKeys = Object.keys(typeSource)
    .map((k) => `${k}: ${typeSource[k]}`)
    .join(";\n");
  const type = `type ${tstype} = {${typeKeys}}`;

  const stateKeys = Object.keys(stateSource)
    .map((k) => `${k}: ${stateSource[k]}`)
    .join(";\n");
  const state = `interface ${appstate} {${stateKeys}}`;

  const factoryFunKeys = Object.keys(typeSource)
    .map((k) => `${k}: ${loremFunctions(typeSource[k])}`)
    .join(",\n");
  const factoryFun = `const ${tstype}Factory = (params: object): ${tstype} => {
    const ${name} = {${factoryFunKeys}};
    return Object.assign(${name}, params) as ${tstype};
}`;

  const initialStateKeys = Object.keys(initialStateSource)
    .map((k) => `${k}: ${(initialStateSource as { [key: string]: any })[k]}`)
    .join(",\n");
  const initialState = `const initial${appstate}State: ${capName}StoreState = {${initialStateKeys}}`;

  const Slice = `
const ${slice} = createSlice({
      name: "${name}",
      initialState: initial${appstate}State,
      reducers: {
        set${tstype}(state: ${appstate}, action: PayloadAction<${tstype}>) {
          state.${tstype?.toLowerCase()} = action.payload;
        },
        set${pluralize(
          tstype as string
        )}(state: ${appstate}, action: PayloadAction<${tstype}[]>) {
          state.${pluralize(tstype as string)?.toLowerCase()} = action.payload;
        },
      },
    });
const ${name}Reducer = ${slice}.reducer;

const select${tstype} = (state: GenericAppState) => state.${`${name}Store`}.${tstype?.toLowerCase()};
const select${pluralize(
    tstype as string
  )} = (state: GenericAppState) => state.${`${name}Store`}.${pluralize(
    tstype as string
  )?.toLowerCase()};
`;

  const exportVars = [
    appstate ? `initial${appstate}State` : null,
    factory ? `${tstype}Factory` : null,
    slice ? `${name}Reducer` : null,
    slice ? `select${tstype}` : null,
    slice ? `select${pluralize(tstype as string)}` : null,
  ]
    .filter((v) => !!v)
    .join(", ");

  const exports = [
    slice
      ? `const { set${tstype}, set${pluralize(
          tstype as string
        )} } = ${slice}.actions\nexport { set${tstype}, set${pluralize(
          tstype as string
        )} }`
      : null,
    tstype || appstate
      ? `export type { ${[tstype, appstate, "GenericAppState"].join(", ")} }`
      : null,
    `export { ${exportVars} }`,
    slice ? `export default ${slice}` : null,
  ]
    .filter((v) => !!v)
    .join("\n");

  // ****** File Summary ******

  const content = `
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Lorem from "../utils/lorem";

${tstype ? `\n${type}\n` : ""}
${appstate ? `\n${state}\n` : ""}
${appstate ? `\n${initialState}\n` : ""}
${factory ? `\n${factoryFun}\n` : ""}
${slice ? `\n${Slice}\n` : ""}

interface GenericAppState {
    ${name}Store: ${capName}StoreState;
    [key: string]: any;
}

${exports}
`;
  return generateFile({ dir: filedir, filename: `${name}.tsx`, content });
};

export { gen_entity_store };
