import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_docker_env = async ({ UmbrellaDir, AppNameSnake }: AppData) => {
  let dir = UmbrellaDir || "";
  dir += "/docker";
  const filename = ".env";
  const content = `COMPOSE_PROJECT_NAME=${AppNameSnake}`;

  return generateFile({ filename, dir, content }, "gen_docker_env");
};

export { gen_docker_env };
