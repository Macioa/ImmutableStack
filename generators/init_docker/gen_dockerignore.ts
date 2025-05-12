import { ImmutableGenerator } from "../../immutable_gen";
import { generateFile } from "../index";

const gen_docker_ignore = async (generator: ImmutableGenerator) => {
  let dir = generator.dir?.ProjectDir || "";
  const filename = ".dockerignore";
  const content = `_build
deps
node_modules
*/node_modules
docker`;

  return generateFile({ filename, dir, content }, "gen_docker_ignore");
};

export { gen_docker_ignore };
