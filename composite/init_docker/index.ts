import { gen_dev_config_env } from "../../generators/init_configs/gen_devcfgenv";
import { gen_docker_config_env } from "../../generators/init_configs/gen_dockercfgenv";
import { gen_docker_compose } from "../../generators/init_docker/gen_dockercompose";
import { gen_docker_dev } from "../../generators/init_docker/gen_dockerdev";
import { gen_docker_env } from "../../generators/init_docker/gen_dockerenv";
import { gen_docker_ignore } from "../../generators/init_docker/gen_dockerignore";
import { gen_docker_prod } from "../../generators/init_docker/gen_dockerprod";
import { inject_docker_scripts_package } from "../../injectors/init_docker/inject_docker_scripts_package";
import { AppData } from "../../readers/get_app_data";
import { execute } from "../../runners/index";

const init_package_json = async ({ UmbrellaDir }: AppData) =>
  execute(
    {
      dir: UmbrellaDir,
      command: "npm init -y",
    },
    "init_package_json"
  );

const init_docker = async (appdata: AppData) => {
  const { UmbrellaDir } = appdata;
  await execute(
    {
      dir: UmbrellaDir,
      command: "mkdir -p docker/pgdata",
    },
    "init_docker"
  );
  const init = await Promise.all([
    gen_docker_compose(appdata),
    gen_docker_dev(appdata),
    gen_docker_prod(appdata),
    gen_docker_env(appdata),
    gen_docker_ignore(appdata),
    gen_docker_config_env(appdata),
    gen_dev_config_env(appdata),
    init_package_json(appdata),
  ]);
  const scripts = await inject_docker_scripts_package(appdata);
  return init.concat(scripts);
};

export { init_docker };
