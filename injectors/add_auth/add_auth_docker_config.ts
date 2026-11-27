import crypto from "crypto";
import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_docker_config = async ({ UmbrellaDir, AppNameSnake, AppNameCamel, ApiNameCamel }: ApiAppData) => {
  const file = join(UmbrellaDir, "config/docker.exs");

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      new RegExp(`config :${AppNameSnake}, ${AppNameCamel}\\.Repo,`),
      (content: string) => {
        if (content.includes(`${AppNameCamel}.AuthRepo`)) return content;

        const withRepo = content.replace(
          new RegExp(
            `(config :${AppNameSnake}, ${AppNameCamel}\\.Repo,[\\s\\S]*?pool_size: 10\\n)`,
            "m"
          ),
          `$1
config :${AppNameSnake}, ${AppNameCamel}.AuthRepo,
  username: "postgres",
  password: "postgres",
  hostname: "${AppNameSnake}_db",
  database: "${AppNameSnake}_auth_db",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
`
        );

        return `${withRepo.trimEnd()}

config :${AppNameSnake}_auth, ${ApiNameCamel}.Endpoint,
  http: [ip: {0, 0, 0, 0}, port: 4001],
  check_origin: false,
  debug_errors: true,
  secret_key_base: "${crypto.randomBytes(32).toString("hex")}"
`;
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_docker_config");
};

export { add_auth_docker_config };

