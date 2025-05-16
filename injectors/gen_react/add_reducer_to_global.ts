import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ImmutableGenerator } from "../../immutable_gen";

const addReducerToGlobal = async (generator: ImmutableGenerator) => {
  const { name, generate, UiDir } = generator;
  const { singleUpperCamel } = name;
  const { appstate } = generate;
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
