import { envConfigFile } from "@/utils/config_paths";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";
import { db } from "@/utils/database";
import crypto from "crypto";

// Opt-in servers and Playwright for the passkey browser tests, plus the auth endpoint's secret
const browserTestConfig = ({ AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) => `
# BROWSER_TESTS=1 runs both servers for the Playwright passkey tests. The built UI
# calls the auth app on localhost:4001, so the auth server takes that port then.
browser_tests? = System.get_env("BROWSER_TESTS") == "1"

config :${AppNameSnake}_${ApiNameSnake}, ${ApiNameCamel}.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: if(browser_tests?, do: 4001, else: 4003)],
  secret_key_base: "${crypto.randomBytes(48).toString("base64")}",
  server: browser_tests?

config :${AppNameSnake}_web, ${AppNameCamel}Web.Endpoint, server: browser_tests?, check_origin: false

# runtime.exs puts the web endpoint on PORT (4000) in every environment.
config :${AppNameSnake}, CORSPlug, origin: ["http://localhost:4000", "http://localhost:4002"]

# test_helper starts \`playwright run-server\` with node: on Windows the Erlang port
# cannot execute the playwright CLI script directly.
config :phoenix_test,
  otp_app: :${AppNameSnake}_web,
  endpoint: ${AppNameCamel}Web.Endpoint,
  playwright: [browser: :chromium, ws_endpoint: "ws://127.0.0.1:3333/"]
`;

const add_auth_test_config = async (apiAppData: ApiAppData) => {
  const { UmbrellaDir, AppNameSnake, AppNameCamel, Database } = apiAppData;
  const { connection: dbConnection, authRepoTuning } = db(Database);
  const connection =
    authRepoTuning +
    dbConnection(`${AppNameSnake}_auth_test#{System.get_env("MIX_TEST_PARTITION")}`, `System.get_env("DB_HOST", "localhost")`);
  const file = envConfigFile(UmbrellaDir, "test");
  const marker = "config :pbkdf2_elixir, :rounds, 1";

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /import Config\n/,
      (content: string) => {
        if (content.includes(marker)) return content;

        return content.replace(
          /import Config\n/,
          `import Config\n\n# Only in tests, remove the complexity from the password hashing algorithm\nconfig :pbkdf2_elixir, :rounds, 1\n\n`
        );
      },
    ],
    [
      InjectType.REPLACE,
      new RegExp(`config :${AppNameSnake}, ${AppNameCamel}\\.Repo,`),
      (content: string) => {
        if (content.includes(`${AppNameCamel}.AuthRepo`)) return content;

        return content.replace(
          new RegExp(
            `(config :${AppNameSnake}, ${AppNameCamel}\\.Repo,[\\s\\S]*?pool_size: System\\.schedulers_online\\(\\) \\* 2\\n)`,
            "m"
          ),
          `$1
config :${AppNameSnake}, ${AppNameCamel}.AuthRepo,
  ${connection}
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2
`
        );
      },
    ],
    [
      InjectType.REPLACE,
      /[\s\S]*/,
      (content: string) =>
        content.includes("config :phoenix_test")
          ? content
          : `${content.trimEnd()}\n${browserTestConfig(apiAppData)}`,
    ],
  ];

  return inject_file({ file, injections }, "add_auth_test_config");
};

export { add_auth_test_config };


