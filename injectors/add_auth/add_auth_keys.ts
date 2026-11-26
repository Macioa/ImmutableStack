import { existsSync } from "fs";
import { join } from "@/utils/path";
import { inject_file, InjectType } from "..";
import { generateFile } from "@/generators/index";
import { ApiAppData } from "@/generators/add_api";
import { OAUTH_PROVIDERS, OAuthProvider, OAuthStep } from "@/generators/add_auth/oauth_providers";
import { keysFile, KeyGroup } from "@/generators/init_configs/gen_keys";
import { CONFIG_ENVS, ConfigEnv, envKeyFile, envKeysDir } from "@/utils/config_paths";

const RUNTIME_MARKER = "# OAuth sign in (external_service_keys/oauth.exs)";

// Docker's auth endpoint always listens on 4001 (add_auth_docker_config); dev uses the resolved ApiPort
const DOCKER_AUTH_PORT = 4001;

const redirectBase = (env: ConfigEnv, port: number) => {
  switch (env) {
    case "prod":
      return "https://<your auth host>";
    case "docker":
      return `http://localhost:${DOCKER_AUTH_PORT}`;
    default:
      return `http://localhost:${port}`;
  }
};

const redirectUri = (base: string, key: string) => `${base}/oauth/${key}/callback`;

// Comment lines for one step: numbered first line, continuation lines, link, then the redirect URI if needed
const stepLines = (base: string, key: string) => ({ text, url, redirect }: OAuthStep, i: number) => {
  const [first, ...rest] = text.split("\n");
  return [
    `  ${i + 1}. ${first}`,
    ...rest.map((line) => `     ${line}`),
    `     ${url}`,
    ...(redirect ? [`     Redirect URI: ${redirectUri(base, key)}`] : []),
  ];
};

const providerGroup = (base: string) => ({ key, label, purpose, steps }: OAuthProvider): KeyGroup => ({
  group: key,
  comment: [`${label}: ${purpose}`, ...steps.flatMap(stepLines(base, key))],
  keys: [
    ["client_id", ""],
    ["client_secret", ""],
  ],
});

const oauthIntro = (base: string) => `
# Each provider's button only shows once both its client ID and secret are set.
# Register this redirect URI with every provider you enable:
#   ${redirectUri(base, "<provider>")}
`;

const oauthContent = (AppNameSnake: string, env: ConfigEnv, base: string) =>
  keysFile(AppNameSnake, env, "oauth", "OAuth sign in", OAUTH_PROVIDERS.map(providerGroup(base))).replace(
    /\nconfig :/,
    `${oauthIntro(base)}\nconfig :`
  );

// Never overwrite a keys file: it may already hold pasted secrets
const add_auth_oauth_keys = ({ UmbrellaDir, AppNameSnake, ApiPort }: ApiAppData, env: ConfigEnv) =>
  existsSync(envKeyFile(UmbrellaDir, env, "oauth"))
    ? [envKeyFile(UmbrellaDir, env, "oauth")]
    : generateFile(
        { dir: envKeysDir(UmbrellaDir, env), filename: "oauth.exs", content: oauthContent(AppNameSnake, env, redirectBase(env, ApiPort || 4001)) },
        "add_auth_keys"
      );

// runtime.exs: hand the resolved provider keys to the auth app
const runtimeKeys = (apiAppName: string) => `
${RUNTIME_MARKER}: a provider shows once its client ID and secret resolve
config :${apiAppName}, oauth: keys.(:oauth)
`;

const add_auth_runtime_keys = ({ UmbrellaDir, AppNameSnake, ApiNameSnake }: ApiAppData) =>
  inject_file(
    {
      file: join(UmbrellaDir, "config", "runtime.exs"),
      injections: [
        [
          InjectType.REPLACE,
          /[\s\S]*/,
          (content: string) =>
            content.includes(RUNTIME_MARKER)
              ? content
              : content.replace(
                  /(_ = \{key, keys\}\n)/,
                  `$1${runtimeKeys(`${AppNameSnake}_${ApiNameSnake}`)}`
                ),
        ],
      ],
    },
    "add_auth_keys"
  );

const add_auth_keys = (apiAppData: ApiAppData) =>
  Promise.all([
    ...CONFIG_ENVS.map((env) => add_auth_oauth_keys(apiAppData, env)),
    add_auth_runtime_keys(apiAppData),
  ]);

export { add_auth_keys };
