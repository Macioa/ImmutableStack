import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ApiAppData } from "../../generators/gen_web_api";
import crypto from "crypto";

const inject_api_to_dev_config = async ({ UmbrellaDir, ApiNameSnake, ApiNameCamel, ApiPort }: ApiAppData) => {
  const file = path.join(UmbrellaDir, "config/dev.exs");
  const apiAppName = `${ApiNameSnake}_web`;
  
  let port: number;
  let portEnv: string;
  
  if (ApiPort) {
    port = ApiPort;
    portEnv = `${ApiNameSnake.toUpperCase()}_PORT`;
  } else {
    const apiNumber = ApiNameSnake.match(/\d+$/)?.[0] || "1";
    port = apiNumber === "1" ? 4000 : 4000 + parseInt(apiNumber) - 1;
    portEnv = apiNumber === "1" ? "PORT" : `PORT${apiNumber}`;
  }
  
  const secretKey = crypto.randomBytes(32).toString("hex");
  
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /# Enable dev routes/,
      `
config :${apiAppName}, ${ApiNameCamel}.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: System.get_env("${portEnv}", "${port}") |> String.to_integer()],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "${secretKey}",
  watchers: []

`
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

