import { inject_file, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";
import { OAUTH_PROVIDERS, OAuthProvider, OAuthStep } from "@/generators/add_auth/oauth_providers";
import { CONFIG_ENVS, ConfigEnv, envKeysFile } from "@/utils/config_paths";

const SECTION_MARKER = "# OAuth sign in";

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
    `  #   ${i + 1}. ${first}`,
    ...rest.map((line) => `  #      ${line}`),
    `  #      ${url}`,
    ...(redirect ? [`  #      Redirect URI: ${redirectUri(base, key)}`] : []),
  ];
};

const providerEntry = (base: string) => ({ key, label, purpose, steps }: OAuthProvider) =>
  [
    `  # ${label}: ${purpose}`,
    ...steps.flatMap(stepLines(base, key)),
    `  ${key}: [`,
    `    client_id: "",`,
    `    client_secret: ""`,
    `  ]`,
  ].join("\n");

const oauthSection = (apiAppName: string, base: string) => `
# ---------------------------------------------------------------------------
${SECTION_MARKER} (${apiAppName})
#
# Each provider's button only shows once both its client ID and secret are set.
# Register this redirect URI with every provider you enable:
#   ${redirectUri(base, "<provider>")}
# ---------------------------------------------------------------------------

oauth = [
${OAUTH_PROVIDERS.map(providerEntry(base)).join(",\n\n")}
]

# Values in this file win. A blank value falls back to its environment variable,
# named <PROVIDER>_<KEY>, e.g. GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.
from_env = fn provider, key -> System.get_env(String.upcase("#{provider}_#{key}"), "") end

oauth =
  for {provider, keys} <- oauth do
    {provider, for({key, value} <- keys, do: {key, if(value == "", do: from_env.(provider, key), else: value)})}
  end

config :${apiAppName}, oauth: oauth
`;

const appendOAuthSection = (apiAppName: string, base: string) => (content: string) =>
  content.includes(SECTION_MARKER) ? content : `${content.trimEnd()}\n${oauthSection(apiAppName, base)}`;

const add_auth_env_keys = ({ UmbrellaDir, AppNameSnake, ApiNameSnake, ApiPort }: ApiAppData, env: ConfigEnv) =>
  inject_file(
    {
      file: envKeysFile(UmbrellaDir, env),
      injections: [
        [InjectType.REPLACE, /[\s\S]*/, appendOAuthSection(`${AppNameSnake}_${ApiNameSnake}`, redirectBase(env, ApiPort || 4001))],
      ],
    },
    "add_auth_keys"
  );

const add_auth_keys = (apiAppData: ApiAppData) => Promise.all(CONFIG_ENVS.map((env) => add_auth_env_keys(apiAppData, env)));

export { add_auth_keys };
