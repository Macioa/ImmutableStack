import { envConfigFile } from "@/utils/config_paths";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";
import { db } from "@/utils/database";

const add_auth_test_config = async ({
  UmbrellaDir,
  AppNameSnake,
  AppNameCamel,
  Database,
}: ApiAppData) => {
  const connection = db(Database).connection(`${AppNameSnake}_auth_test#{System.get_env("MIX_TEST_PARTITION")}`, `System.get_env("DB_HOST", "localhost")`);
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
  ];

  return inject_file({ file, injections }, "add_auth_test_config");
};

export { add_auth_test_config };


