import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ImmutableGenerator } from "../../generators/gen_controller";

const addReducerToGlobal = async (generator: ImmutableGenerator) => {
  const { name, generate, UiDir } = generator;
  const { appstate } = generate;
  const file = path.join(UiDir as string, "src/store/index.tsx");

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /reducer\:\scombineReducers\(\{/,
      `\n${name}Store: ${name}Reducer,`,
    ],
    // [
    //   InjectType.AFTER,
    //   /const\sREQUESTSKEY\s=\sSymbol\(requestsKey\);/,
    //   `\nconst ${namekey} = Symbol(${name}Key);`,
    // ],
    [
      InjectType.AFTER,
      /import\s.*/,
      `\nimport { ${name}Reducer, ${appstate} } from './${name}';`,
    ],
    [
      InjectType.AFTER,
      /type\s+[A-Za-z]+State\s+\=\s+\{/,
      `\n  ${name}Store: ${appstate};`,
    ],
    // [InjectType.AFTER, /export\s\{\s*\w+\s*,\s*REQUESTSKEY/, `, ${namekey}`],
  ];

  return inject_file({ file, injections });
};

export { addReducerToGlobal };
