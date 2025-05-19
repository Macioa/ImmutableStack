import { GenTypes, ImmutableGenerator } from "../../immutable_gen";
import { execute } from "../../runners";
import { log } from "../../utils/logger";

const gen_schema = async (
  {
    generate: { schema, databaseTable },
    AppData: { WebDir, UmbrellaDir },
  }: ImmutableGenerator,
  genTypes: GenTypes
) => {
  const source = (genTypes.Schema || genTypes.ImmutableGlobal)?.["ex"] || {};
  log({ level: 9 }, "Gen schema source: ", source);
  const command =
    `cd ${WebDir.match(
      /\w*\/\w*$/g
    )} && mix phx.gen.schema ${schema} ${databaseTable}` +
    Object.keys(source)
      .map((k) => ` ${k}:${source[k]}`)
      .join("") +
    " --no-prompts";

  log(
    { level: 2, color: "BLUE" },
    `Generating Phoenix Schema and Migrations for ${schema}`
  );
  return execute({ command, dir: UmbrellaDir }, "gen_schema");
};

export { gen_schema };
