import { execute } from "../runners";
import { log } from "../utils/logger";
import { inject_router } from "../injectors/inject_router";

const handle_json = async (generator: any, typeDict: any): Promise<any> => {
  const { generate, ...rest } = generator;
  log({level: 8}, `Generating JSON API for ${JSON.stringify(rest)}`);
  log({level: 9}, `TypeDict: ${JSON.stringify(typeDict)}`);

  const source = (typeDict.DatabaseModel || typeDict.ImmutableGlobal)["ex"];

  const promises = [gen_json(generator, source), inject_router(generator)];
  const paths = Promise.all(promises);

  return (await paths).flat();
};

const gen_json = async (generator: any, source: any) => {
  const gen = generator.generate;
  const command =
    `mix phx.gen.json ${gen.context} ${gen.schema} ${gen.databaseModel}` +
    Object.keys(source)
      .map((k) => ` ${k}:${source[k]}`)
      .join("") +
    " --no-prompts";

  log({ level: 2, color: "BLUE" }, `Generating Phoenix API for ${gen.context}`);
  return execute({ command, dir: generator.WebDir });
};

export { gen_json, handle_json };