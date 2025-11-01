import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ApiAppData } from "../../generators/add_api";
import crypto from "crypto";

const inject_api_to_config = async ({ UmbrellaDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const file = path.join(UmbrellaDir, "config/config.exs");
  const apiAppName = `${ApiNameSnake}_web`;
  const signingKey = crypto.randomBytes(8).toString("hex");
  const AppNameCamel = AppNameSnake.replace(/_([a-z])/g, (g: string) => g[1].toUpperCase()).replace(/^./, (g: string) => g.toUpperCase());
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /config\s+:logger/,
      `
config :${apiAppName},
  ecto_repos: [${AppNameCamel}.Repo],
  generators: [context_app: :${AppNameSnake}, binary_id: true]

config :${apiAppName}, ${ApiNameCamel}.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [json: ${ApiNameCamel}.ErrorJSON],
    layout: false
  ],
  pubsub_server: ${AppNameCamel}.PubSub,
  live_view: [signing_salt: "${signingKey}"]

`
    ]
  ];

  return inject_file({ file, injections }, "inject_api_to_config");
};

export { inject_api_to_config };

