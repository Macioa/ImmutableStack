import { envConfigFile } from "@/utils/config_paths";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";
import { db } from "@/utils/database";

const add_auth_dev_config = async ({ UmbrellaDir, AppNameSnake, AppNameCamel, Database }: ApiAppData) => {
  const { connection: dbConnection, authRepoTuning } = db(Database);
  const connection = authRepoTuning + dbConnection(`${AppNameSnake}_auth_db`);
  const file = envConfigFile(UmbrellaDir, "dev");
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
  ${connection}
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10
`
        );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_dev_config");
};

export { add_auth_dev_config };

