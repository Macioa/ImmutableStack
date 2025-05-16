import { ImmutableGenerator } from "../../immutable_gen";
import { generateFile } from "../index";

const gen_docker_ignore = async (generator: ImmutableGenerator) => {
  let dir = generator.dir?.ProjectDir || "";
  const filename = ".dockerignore";
  const content = `**/.pgdata
**/_build
**/deps
**/node_modules`;

  return generateFile({ filename, dir, content }, "gen_docker_ignore");
};

export { gen_docker_ignore };
