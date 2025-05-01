import { join } from "path";
import { GenTypes, ImmutableGenerator } from "../../../immutable_gen";
import { mark } from "../../../repair/index";
import { log } from "../../../utils/logger";
import { loremFunctions } from "../../../utils/lorem";
import { generateFile } from "../../index";
import { get_reducer_exports, get_reducers } from "./reducers";
import { get_selector_exports, get_selectors } from "./selectors";
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

  const type = mark({
    str: `type ${tstype} = {${typeKeys}}`,
    type: "TYPEDEF",
    entity: name.singleUpperCamel,
  });

  const stateKeys = Object.keys(stateSource || {})
    .map((k) => `${k}: ${stateSource?.[k]}`)
    .join(";\n");
  const state = mark({
    str: `interface ${appstate} {${stateKeys}}`,
    type: "APPSTATE",
    entity: name.singleUpperCamel,
  });

  const factoryFunKeys = Object.keys(typeSource || {})
    //@ts-ignore
    .map((k) => `${k}: ${loremFunctions(typeSource?.[k])}`)
    .join(",\n");
  const factoryFunInit = `const ${tstype}Factory = (params: object = {}): ${tstype} => {
    const ${entityNameSingleUpperCamel} = {${factoryFunKeys}};
    return Object.assign(${entityNameSingleUpperCamel}, params) as ${tstype};
}`;
  const factoryFun = mark({
    str: factoryFunInit,
    type: "FACTORY",
    entity: name.singleUpperCamel,
  });

  const initialStateKeys = Object.keys(initialStateSource)
    .map((k) => `${k}: ${(initialStateSource as { [key: string]: any })[k]}`)
    .join(",\n");

  const initialState = mark({
    str: `const initial${appstate}State: ${entityNameSingleUpperCamel}StoreState = {${initialStateKeys}}`,
    type: "INITIAL_APPSTATE",
    entity: name.singleUpperCamel,
  });

  const Slice = `
const ${sliceName} = createSlice({
      name: "${entityNameSingleUpperCamel}",
      initialState: initial${appstate}State,
      reducers: {
        ${get_reducers(generator)
          .map((rdcr) =>
            mark({ str: rdcr, type: "REDUCER", entity: name.singleUpperCamel })
          )
          .join(",\n")}
      },
    });
const ${entityNameSingleUpperCamel}Reducer = ${sliceName}.reducer;

${get_selectors(generator)
  ?.map((sel) =>
    mark({ str: sel, type: "SELECTOR", entity: name.singleUpperCamel })
  )
  .join(",\n")}
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

  const genericAppStateInit = `interface GenericAppState {
    ${entityNameSingleUpperCamel}Store: ${entityNameSingleUpperCamel}StoreState;
    [key: string]: any;
}`;
  const genericAppState = mark({
    str: genericAppStateInit,
    type: "APPSTATE",
    entity: name.singleUpperCamel,
  });

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
