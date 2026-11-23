import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ApiAppData } from "../../generators/add_api";
import crypto from "crypto";

const DEV_ROUTES = /# Enable dev routes/;

const usedDevPorts = (content: string) =>
  [...content.matchAll(/get_env\("\w*PORT\w*",\s*"(\d+)"\)/g)].map(([, port]) => Number(port));

const nextDevPort = (content: string) => Math.max(4000, ...usedDevPorts(content)) + 1;

const numberedDevPort = (content: string, apiNumber: string) => {
  const preferred = 4000 + parseInt(apiNumber) - 1;
  return usedDevPorts(content).includes(preferred) ? nextDevPort(content) : preferred;
};

const get_dev_port = (content: string, ApiNameSnake: string, ApiPort?: number) => {
  const apiNumber = ApiNameSnake.match(/\d+$/)?.[0];
  const namedEnv = `${ApiNameSnake.toUpperCase()}_PORT`;
  if (ApiPort) return { port: ApiPort, portEnv: namedEnv };
  return apiNumber
    ? { port: numberedDevPort(content, apiNumber), portEnv: `PORT${apiNumber}` }
    : { port: nextDevPort(content), portEnv: namedEnv };
};

const inject_api_to_dev_config = async ({ UmbrellaDir, AppNameSnake, ApiNameSnake, ApiNameCamel, ApiPort }: ApiAppData) => {
  const file = path.join(UmbrellaDir, "config/dev.exs");
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const secretKey = crypto.randomBytes(32).toString("hex");

  const endpointConfig = (content: string) => {
    const { port, portEnv } = get_dev_port(content, ApiNameSnake, ApiPort);
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

export { inject_api_to_dev_config };

