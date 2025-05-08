import { ImmutableGenerator } from "../../immutable_gen";
import { generateFile } from "../index";

const gen_docker_env = async (generator: ImmutableGenerator) => {
  let dir = generator.dir?.ProjectDir || "";
  dir += "/docker";
  const filename = ".env";
  const AppNameSnake = generator.appName.snake;
  const content = `COMPOSE_PROJECT_NAME=${AppNameSnake}`;

  return generateFile({ filename, dir, content }, "gen_docker_env");
};

export { gen_docker_env };
