import { execute } from "../../runners";
import { log } from "../../utils/logger";
import { ImmutableGenerator, GenTypes } from "../gen_controller";

const gen_schema = async ({generate, WebDir}: ImmutableGenerator, genTypes: GenTypes) => {
  const {schema, databaseModel} = generate;
  const source = (genTypes.Schema || genTypes.ImmutableGlobal)?.['ex'] || {}
  log({level: 9}, "Gen schema source: ", source);
  const command =
    `mix phx.gen.schema ${schema} ${databaseModel}` +
    Object.keys(source)
      .map((k) => ` ${k}:${source[k]}`)
      .join("") +
    " --no-prompts";

  log({ level: 2, color: "BLUE" }, `Generating Phoenix Schema and Migrations for ${schema}`);
  return execute({ command, dir: WebDir || "." });
};

export { gen_schema };