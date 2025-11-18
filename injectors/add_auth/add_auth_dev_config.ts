import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_dev_config = async ({ UmbrellaDir, AppNameSnake, AppNameCamel }: ApiAppData) => {
  const file = join(UmbrellaDir, "config/dev.exs");
  const apiAppName = `${AppNameSnake}_auth`;

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      new RegExp(`config :${AppNameSnake}, ${AppNameCamel}\\.Repo,`),
      (content: string) => {
        if (content.includes(`${AppNameCamel}.AuthRepo`)) return content;

        return content.replace(
          new RegExp(
            `(config :${AppNameSnake}, ${AppNameCamel}\\.Repo,[\\s\\S]*?pool_size: 10\\n)`,
            "m"
          ),
          `$1
config :${AppNameSnake}, ${AppNameCamel}.AuthRepo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "${AppNameSnake}_auth_db",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
`
        );
      },
    ],
    [
      InjectType.AFTER,
      new RegExp(`config :${apiAppName}, AuthWeb\\.Endpoint,[\\s\\S]*?watchers: \\[\\]`),
      `\n# OAuth configuration for development
# Set these in your environment or uncomment and set directly here for testing
config :${apiAppName}, :oauth,
  google: [
    client_id: System.get_env("GOOGLE_CLIENT_ID") || "",
    client_secret: System.get_env("GOOGLE_CLIENT_SECRET") || ""
  ],
  microsoft: [
    client_id: System.get_env("MICROSOFT_CLIENT_ID") || "",
    client_secret: System.get_env("MICROSOFT_CLIENT_SECRET") || ""
  ]\n`
    ],
  ];

  return inject_file({ file, injections }, "add_auth_dev_config");
};

export { add_auth_dev_config };

