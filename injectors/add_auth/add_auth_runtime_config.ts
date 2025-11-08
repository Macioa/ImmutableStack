import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_runtime_config = async ({ UmbrellaDir, AppNameSnake, AppNameCamel }: ApiAppData) => {
  const file = join(UmbrellaDir, "config/runtime.exs");

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      new RegExp(`config :${AppNameSnake}, ${AppNameCamel}\\.Repo,`),
      (content: string) => {
        if (content.includes("AUTH_DATABASE_URL")) return content;

        return content.replace(
          new RegExp(
            `(config :${AppNameSnake}, ${AppNameCamel}\\.Repo,[\\s\\S]*?socket_options: maybe_ipv6\\n)`,
            "m"
          ),
          `$1
  auth_database_url =
    System.get_env("AUTH_DATABASE_URL") ||
      raise """
      environment variable AUTH_DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/AUTH_DATABASE
      """

  config :${AppNameSnake}, ${AppNameCamel}.AuthRepo,
    url: auth_database_url,
    pool_size: String.to_integer(System.get_env("AUTH_POOL_SIZE") || "10"),
    socket_options: maybe_ipv6
`
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_runtime_config");
};

export { add_auth_runtime_config };

