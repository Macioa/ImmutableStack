import { envConfigFile } from "@/utils/config_paths";
import { inject_file, Injection, InjectType } from "../index";
import { ApiAppData } from "../../generators/add_api";
import crypto from "crypto";
import { existsSync, readFileSync } from "fs";

const DEV_ROUTES = /# Enable dev routes/;

const usedDevPorts = (content: string) =>
  [...content.matchAll(/get_env\("\w*PORT\w*",\s*"(\d+)"\)/g)].map(([, port]) => Number(port));

const nextDevPort = (content: string) => Math.max(4000, ...usedDevPorts(content)) + 1;

const numberedDevPort = (content: string, apiNumber: string) => {
  const preferred = 4000 + parseInt(apiNumber) - 1;
  return usedDevPorts(content).includes(preferred) ? nextDevPort(content) : preferred;
};

const get_dev_port = (content: string, ApiNameSnake: string, ApiPort?: number, ApiPortEnv?: string) => {
  const apiNumber = ApiNameSnake.match(/\d+$/)?.[0];
  const namedEnv = `${ApiNameSnake.toUpperCase()}_PORT`;
  if (ApiPort) return { port: ApiPort, portEnv: ApiPortEnv || namedEnv };
  return apiNumber
    ? { port: numberedDevPort(content, apiNumber), portEnv: `PORT${apiNumber}` }
    : { port: nextDevPort(content), portEnv: namedEnv };
};

// Picks the dev port once, before generation, so the endpoint config, UI requests and
// OAuth redirect comments all use the same port
const resolve_api_port = (apiAppData: ApiAppData): ApiAppData => {
  const { UmbrellaDir, ApiNameSnake, ApiPort } = apiAppData;
  const file = envConfigFile(UmbrellaDir, "dev");
  const content = existsSync(file) ? readFileSync(file, "utf8") : "";
  const { port, portEnv } = get_dev_port(content, ApiNameSnake, ApiPort);
  return { ...apiAppData, ApiPort: port, ApiPortEnv: portEnv };
};

const inject_api_to_dev_config = async ({ UmbrellaDir, AppNameSnake, ApiNameSnake, ApiNameCamel, ApiPort, ApiPortEnv }: ApiAppData) => {
  const file = envConfigFile(UmbrellaDir, "dev");
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const secretKey = crypto.randomBytes(32).toString("hex");

  const endpointConfig = (content: string) => {
    const { port, portEnv } = get_dev_port(content, ApiNameSnake, ApiPort, ApiPortEnv);
    return `
config :${apiAppName}, ${ApiNameCamel}.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: System.get_env("${portEnv}", "${port}") |> String.to_integer()],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "${secretKey}",
  watchers: []

`;
  };

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      DEV_ROUTES,
      (content: string) => content.replace(DEV_ROUTES, (match) => `${endpointConfig(content)}${match}`),
    ],
    [
      InjectType.BEFORE,
      /config\s+:logger/,
      `config :${apiAppName}, dev_routes: true
`
    ]
  ];

  return inject_file({ file, injections }, "inject_api_to_dev_config");
};

export { inject_api_to_dev_config, resolve_api_port };

