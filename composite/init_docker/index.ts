import { gen_docker_config_env } from "../../generators/init_configs/gen_dockercfgenv";
import { gen_dev_config_env } from "../../generators/init_configs/gen_devcfgenv";
import { gen_docker_compose } from "../../generators/init_docker/gen_dockercompose";
import { gen_docker_dev } from "../../generators/init_docker/gen_dockerdev";
import { gen_docker_env } from "../../generators/init_docker/gen_dockerenv";
import { gen_docker_ignore } from "../../generators/init_docker/gen_dockerignore";
import { gen_docker_prod } from "../../generators/init_docker/gen_dockerprod";
import { ImmutableGenerator } from "../../immutable_gen";
import { inject_docker_scripts_package } from "../../injectors/init_docker/inject_docker_scripts_package";
import { execute } from "../../runners/index";

const init_package_json = async (generator: ImmutableGenerator) =>
  execute(
    {
      dir: generator.dir?.ProjectDir || "",
      command: "npm init -y",
    },
    "init_package_json"
  );

const init_docker = async (generator: ImmutableGenerator) => {
  await execute(
    {
      dir: generator.dir.ProjectDir || "",
      command:
        "mkdir -p docker/pgdata",
    },
    "init_docker"
  );
  const init = await Promise.all([
    gen_docker_compose(generator),
    gen_docker_dev(generator),
    gen_docker_prod(generator),
    gen_docker_env(generator),
    gen_docker_ignore(generator),
    gen_docker_config_env(generator),
    gen_dev_config_env(generator),
    init_package_json(generator),
  ]);
  const scripts = await inject_docker_scripts_package(generator);
  return init.concat(scripts);
};

export { init_docker };
