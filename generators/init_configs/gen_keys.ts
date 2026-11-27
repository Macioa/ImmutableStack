import { existsSync } from "fs";
import { generateFile } from "@/generators/index";
import { AppData } from "@/readers/get_app_data";
import { CONFIG_ENVS, ConfigEnv, envKeyFile, envKeysDir } from "@/utils/config_paths";

// A key group: env var fallback is <GROUP>_<KEY>, e.g. email.api_key -> EMAIL_API_KEY
type KeyGroup = { group: string; comment: string[]; keys: [string, string][] };
type KeyCategory = { category: string; title: string; groups: (appData: AppData, env: ConfigEnv) => KeyGroup[] };

const keysHeader = (env: ConfigEnv, title: string) => `import Config

# ${title} keys for the ${env} environment.
#
# A value written here always wins. A blank value falls back to its environment
# variable, named <GROUP>_<KEY> (e.g. EMAIL_API_KEY), when :allow_env_keys is on
# in config/${env}/config.exs (on by default outside prod). Paste each value
# between the quotes. Never commit real secrets.
# A feature whose keys are blank is switched off.
`;

const groupBlock = ({ group, comment, keys }: KeyGroup) =>
  [
    ...comment.map((line) => `    # ${line}`.trimEnd()),
    `    ${group}: [`,
    keys.map(([key, value]) => `      ${key}: ${JSON.stringify(value)}`).join(",\n"),
    `    ]`,
  ].join("\n");

const keysFile = (appName: string, env: ConfigEnv, category: string, title: string, groups: KeyGroup[]) =>
  `${keysHeader(env, title)}
config :${appName}, :keys,
  ${category}: [
${groups.map(groupBlock).join(",\n\n")}
  ]
`;

// Env var fallback for blank keys (see runtime.exs): on everywhere but prod
const allowEnvKeys = (AppNameSnake: string, env: ConfigEnv) => `
# A blank value in config/${env}/external_service_keys/*.exs falls back to its environment
# variable (<GROUP>_<KEY>, e.g. EMAIL_API_KEY) only while this is true.
config :${AppNameSnake}, allow_env_keys: ${env !== "prod"}
`;

// Never overwrite a keys file: it may already hold pasted secrets
const gen_key_file = (appData: AppData, env: ConfigEnv, { category, title, groups }: KeyCategory) =>
  existsSync(envKeyFile(appData.UmbrellaDir, env, category))
    ? [envKeyFile(appData.UmbrellaDir, env, category)]
    : generateFile(
        {
          dir: envKeysDir(appData.UmbrellaDir, env),
          filename: `${category}.exs`,
          content: keysFile(appData.AppNameSnake, env, category, title, groups(appData, env)),
        },
        "gen_keys"
      );

// Init only creates each env's empty folder; features like add_auth add their key files
const gen_env_keys_dir = ({ UmbrellaDir }: AppData, env: ConfigEnv) =>
  generateFile({ dir: envKeysDir(UmbrellaDir, env), filename: ".gitkeep", content: "" }, "gen_keys");

const gen_all_env_keys = (appData: AppData) => Promise.all(CONFIG_ENVS.map((env) => gen_env_keys_dir(appData, env)));

// Writes one category's key file in every env
const gen_category_keys = (appData: AppData, category: KeyCategory) =>
  Promise.all(CONFIG_ENVS.map((env) => gen_key_file(appData, env, category)));

export { allowEnvKeys, gen_all_env_keys, gen_category_keys, gen_key_file, keysFile, KeyCategory, KeyGroup };
