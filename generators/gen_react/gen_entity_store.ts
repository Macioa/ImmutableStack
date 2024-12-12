import { join } from "path";
import { ImmutableGenerator, Names } from "../../immutable_gen";
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
  const { name, generate, LibDir } = generator;
  const { singleUpperCamel: entityNameSingleUpperCamel } = name;
  const { tstype, appstate, factory } = generate;
  const sliceName = generate.stateSlice?.name;
  const filedir = join(LibDir as string, "lib/typescript/state/");

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
    const ${entityNameSingleUpperCamel} = {${factoryFunKeys}};
    return Object.assign(${entityNameSingleUpperCamel}, params) as ${tstype};
}`;

  const initialStateKeys = Object.keys(initialStateSource)
    .map((k) => `${k}: ${(initialStateSource as { [key: string]: any })[k]}`)
    .join(",\n");
  const initialState = `const initial${appstate}State: ${entityNameSingleUpperCamel}StoreState = {${initialStateKeys}}`;

  const Slice = `
const ${sliceName} = createSlice({
      name: "${entityNameSingleUpperCamel}",
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
const ${entityNameSingleUpperCamel}Reducer = ${sliceName}.reducer;

const select${tstype} = (state: GenericAppState) => state.${`${entityNameSingleUpperCamel}Store`}.${tstype?.toLowerCase()};
const select${pluralize(
    tstype as string
  )} = (state: GenericAppState) => state.${`${entityNameSingleUpperCamel}Store`}.${pluralize(
    tstype as string
  )?.toLowerCase()};
`;

  const exportVars = [
    appstate ? `initial${appstate}State` : null,
    factory ? `${tstype}Factory` : null,
    sliceName ? `${entityNameSingleUpperCamel}Reducer` : null,
    sliceName ? `select${tstype}` : null,
    sliceName ? `select${pluralize(tstype as string)}` : null,
  ]
    .filter((v) => !!v)
    .join(", ");

  const exports = [
    sliceName
      ? `const { set${tstype}, set${pluralize(
          tstype as string
        )} } = ${sliceName}.actions\nexport { set${tstype}, set${pluralize(
          tstype as string
        )} }`
      : null,
    tstype || appstate
      ? `export type { ${[tstype, appstate, "GenericAppState"].join(", ")} }`
      : null,
    `export { ${exportVars} }`,
    sliceName ? `export default ${sliceName}` : null,
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
${sliceName ? `\n${Slice}\n` : ""}

interface GenericAppState {
    ${entityNameSingleUpperCamel}Store: ${entityNameSingleUpperCamel}StoreState;
    [key: string]: any;
}

${exports}
`;
  return generateFile(
    { dir: filedir, filename: `${entityNameSingleUpperCamel}.tsx`, content },
    "gen_entity_store"
  );
};

export { gen_entity_store };
