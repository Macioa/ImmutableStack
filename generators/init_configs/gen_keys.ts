import { generateFile } from "@/generators/index";
import { AppData } from "@/readers/get_app_data";
import { CONFIG_ENVS, ConfigEnv, envConfigDir } from "@/utils/config_paths";

const keysHeader = (env: ConfigEnv) => `import Config

# External service keys for the ${env} environment.
#
# Every external key the project uses lives in this file. Each entry says what
# the key is for and links every step needed to obtain it, in order.
# Paste each value between the quotes. Never commit real secrets.
# A feature whose keys are blank is switched off.
`;

const gen_env_keys = ({ UmbrellaDir }: AppData, env: ConfigEnv) =>
  generateFile({ dir: envConfigDir(UmbrellaDir, env), filename: "keys.exs", content: keysHeader(env) }, "gen_env_keys");

const gen_all_env_keys = (appdata: AppData) => Promise.all(CONFIG_ENVS.map((env) => gen_env_keys(appdata, env)));

export { gen_all_env_keys, gen_env_keys };
