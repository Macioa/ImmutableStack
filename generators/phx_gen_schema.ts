import { execute } from "../runners";
import { log } from "../utils/logger";

const gen_schema = async (generator: any, source: any) => {
  const gen = generator.generate;
  const command =
    `mix phx.gen.schema ${gen.schema} ${gen.databaseModel}` +
    Object.keys(source)
      .map((k) => ` ${k}:${source[k]}`)
      .join("") +
    " --no-prompts";

  log({ level: 2, color: "BLUE" }, `Generating Phoenix Schema and Migrations for ${gen.schema}`);
  return execute({ command, dir: generator.WebDir });
};

export { gen_schema };