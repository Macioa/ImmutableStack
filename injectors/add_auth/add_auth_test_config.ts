import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_test_config = async ({
  UmbrellaDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const file = join(UmbrellaDir, "config/test.exs");
  const marker = "config :bcrypt_elixir, :log_rounds, 1";

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /import Config\n/,
      (content: string) => {
        if (content.includes(marker)) return content;

        return content.replace(
          /import Config\n/,
          `import Config\n\n# Only in tests, remove the complexity from the password hashing algorithm\nconfig :bcrypt_elixir, :log_rounds, 1\n\n`
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
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "${AppNameSnake}_auth_test#{System.get_env("MIX_TEST_PARTITION")}",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: System.schedulers_online() * 2
`
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_test_config");
};

export { add_auth_test_config };


