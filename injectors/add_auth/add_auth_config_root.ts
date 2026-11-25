import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const add_auth_config_root = async ({ UmbrellaDir, AppNameSnake, AppNameCamel }: ApiAppData) => {
  const file = join(UmbrellaDir, "config/config.exs");
  const apiAppName = `${AppNameSnake}_auth`;

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      new RegExp(`config :${AppNameSnake},`),
      (content: string) => {
        if (content.includes(`${AppNameCamel}.AuthRepo`)) return content;

        return content
          .replace(
            new RegExp(
              `config :${AppNameSnake},\\s*ecto_repos: \\[${AppNameCamel}\\.Repo\\]`,
              "m"
            ),
            `config :${AppNameSnake},\n  ecto_repos: [${AppNameCamel}.Repo, ${AppNameCamel}.AuthRepo]`
          )
          .replace(
            new RegExp(
              `config :${apiAppName},\\s*ecto_repos: \\[${AppNameCamel}\\.Repo\\],`,
              "m"
            ),
            `config :${apiAppName},\n  ecto_repos: [${AppNameCamel}.AuthRepo],`
          );
      },
    ],
  ];

  return inject_file({ file, injections }, "add_auth_config_root");
};

export { add_auth_config_root };

