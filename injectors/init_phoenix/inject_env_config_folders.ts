import { existsSync, mkdirSync, renameSync } from "fs";
import { join } from "@/utils/path";
import { inject_file, InjectType } from "..";
import { AppData } from "@/readers/get_app_data";
import { gen_all_env_keys } from "@/generators/init_configs/gen_keys";
import { CONFIG_ENVS, ConfigEnv, envConfigDir, envConfigFile } from "@/utils/config_paths";

// phx.new writes config/<env>.exs; move each to config/<env>/config.exs
const move_env_config = (UmbrellaDir: string, env: ConfigEnv) => {
  const legacy = join(UmbrellaDir, "config", `${env}.exs`);
  mkdirSync(envConfigDir(UmbrellaDir, env), { recursive: true });
  if (existsSync(legacy)) renameSync(legacy, envConfigFile(UmbrellaDir, env));
  return envConfigFile(UmbrellaDir, env);
};

const import_env_folders = (UmbrellaDir: string) =>
  inject_file(
    {
      file: join(UmbrellaDir, "config", "config.exs"),
      injections: [
        [
          InjectType.REPLACE,
          /# Import environment specific config\.[^\n]*\n# of this file[^\n]*\nimport_config "#\{config_env\(\)\}\.exs"/,
          `# Import environment specific config, then that environment's external
# service keys. These must remain at the bottom of this file so they
# override the configuration defined above.
import_config "#{config_env()}/config.exs"
import_config "#{config_env()}/keys.exs"`,
        ],
      ],
    },
    "inject_env_config_folders"
  );

const inject_env_config_folders = async (appdata: AppData) => {
  const moved = CONFIG_ENVS.map((env) => move_env_config(appdata.UmbrellaDir, env));
  const imports = await import_env_folders(appdata.UmbrellaDir);
  const keys = await gen_all_env_keys(appdata);
  return [moved, imports, keys].flat(2);
};

export { inject_env_config_folders };
