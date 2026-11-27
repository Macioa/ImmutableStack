import { join } from "@/utils/path";

// Each Mix env keeps its settings in config/<env>/config.exs and external service keys in config/<env>/external_service_keys/<category>.exs
const CONFIG_ENVS = ["dev", "test", "prod", "docker"] as const;
type ConfigEnv = (typeof CONFIG_ENVS)[number];

const envConfigDir = (umbrellaDir: string, env: ConfigEnv) => join(umbrellaDir || ".", "config", env);
const envConfigFile = (umbrellaDir: string, env: ConfigEnv) => join(envConfigDir(umbrellaDir, env), "config.exs");
const envKeysDir = (umbrellaDir: string, env: ConfigEnv) => join(envConfigDir(umbrellaDir, env), "external_service_keys");
const envKeyFile = (umbrellaDir: string, env: ConfigEnv, category: string) => join(envKeysDir(umbrellaDir, env), `${category}.exs`);

export { CONFIG_ENVS, ConfigEnv, envConfigDir, envConfigFile, envKeysDir, envKeyFile };
