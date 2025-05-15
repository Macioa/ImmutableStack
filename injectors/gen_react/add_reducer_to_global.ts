import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ImmutableGenerator } from "../../immutable_gen";

const addReducerToGlobal = async (generator: ImmutableGenerator) => {
  const {
    name: { singleUpperCamel },
    generate: { appstate },
    AppData: { UiDir },
  } = generator;
  const file = path.join(UiDir as string, "src/store/index.tsx");

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /reducer\:\scombineReducers\(\{/,
      `\n${singleUpperCamel}Store: ${singleUpperCamel}Reducer,`,
    ],
    [
      InjectType.AFTER,
      /import\s.*/,
      `\nimport type { ${appstate} } from '@state/${singleUpperCamel}';\nimport { ${singleUpperCamel}Reducer } from '@state/${singleUpperCamel}';`,
    ],
    [
      InjectType.AFTER,
      /type\s+[A-Za-z0-9_]+State\s+\=\s+\{/,
      `\n  ${singleUpperCamel}Store: ${appstate};`,
    ],
  ];

  return inject_file({ file, injections }, "addReducerToGlobal");
};

export { addReducerToGlobal };
