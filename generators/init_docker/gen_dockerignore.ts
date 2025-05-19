import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_docker_ignore = async ({ UmbrellaDir }: AppData) => {
  let dir = UmbrellaDir || "";
  const filename = ".dockerignore";
  const content = `_build
deps
node_modules
*/node_modules
docker`;

  return generateFile({ filename, dir, content }, "gen_docker_ignore");
};

export { gen_docker_ignore };
