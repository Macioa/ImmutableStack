import { execute } from "../runners";
import { log } from "../utils/logger";

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

export { gen_json };