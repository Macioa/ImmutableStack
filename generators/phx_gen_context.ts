import { execute } from "../runners";
import { log } from "../utils/logger";

const gen_context = async (generator: any, source: any) => {
  const gen = generator.generate;
  const command =
    `mix phx.gen.context ${gen.context} ${gen.schema}` +
    Object.keys(source)
      .map((k) => ` ${k}:${source[k]}`)
      .join("") +
    " --no-prompts";

  log({ level: 2, color: "BLUE" }, `Generating Phoenix Context: ${gen.context}`);
  return execute({ command, dir: generator.WebDir });
};

export { gen_context };