import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_docker_init_db = async ({ UmbrellaDir, AppNameSnake }: ApiAppData) => {
  const dir = join(UmbrellaDir, "docker/initdb");
  const filename = "01_create_auth_db.sql";
  const content = `CREATE DATABASE ${AppNameSnake}_auth_db OWNER postgres;
`;

  return generateFile({ dir, filename, content }, "add_auth_docker_init_db");
};

export { add_auth_docker_init_db };

