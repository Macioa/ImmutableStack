import { existsSync, mkdirSync, renameSync } from "fs";
import { join } from "@/utils/path";
import { inject_file, InjectType } from "..";
import { AppData } from "@/readers/get_app_data";
import { allowEnvKeys, gen_all_env_keys } from "@/generators/init_configs/gen_keys";
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
          `# Import environment specific config, then every file in
# config/<env>/external_service_keys/. These must remain at the bottom of this file so they
# override the configuration defined above.
import_config "#{config_env()}/config.exs"

for keys <- "#{config_env()}/external_service_keys/*.exs" |> Path.expand(__DIR__) |> Path.wildcard() |> Enum.sort(),
    do: import_config(keys)`,
        ],
      ],
    },
    "inject_env_config_folders"
  );

const inject_allow_env_keys = ({ UmbrellaDir, AppNameSnake }: AppData, env: ConfigEnv) =>
  inject_file(
    {
      file: envConfigFile(UmbrellaDir, env),
      injections: [
        [
          InjectType.REPLACE,
          /[\s\S]*/,
          (content: string) =>
            content.includes("allow_env_keys") ? content : `${content.trimEnd()}
${allowEnvKeys(AppNameSnake, env)}`,
        ],
      ],
    },
    "inject_env_config_folders"
  );

const inject_env_config_folders = async (appdata: AppData) => {
  const moved = CONFIG_ENVS.map((env) => move_env_config(appdata.UmbrellaDir, env));
  const imports = await import_env_folders(appdata.UmbrellaDir);
  // dev and docker config.exs are generated later with the line already in them
  const allow = await Promise.all(
    CONFIG_ENVS.filter((env) => existsSync(envConfigFile(appdata.UmbrellaDir, env))).map((env) => inject_allow_env_keys(appdata, env))
  );
  const keys = await gen_all_env_keys(appdata);
  return [moved, imports, allow, keys].flat(3);
};

export { inject_env_config_folders };
