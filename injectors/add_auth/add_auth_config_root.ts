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
    [
      InjectType.AFTER,
      new RegExp(`config :${apiAppName}, AuthWeb\\.Endpoint,[\\s\\S]*?live_view: \\[signing_salt: "[^"]+"\\]`),
      `\n# OAuth configuration
# Google OAuth: https://console.cloud.google.com/apis/credentials
config :${apiAppName}, :oauth,
  google: [
    client_id: System.get_env("GOOGLE_CLIENT_ID") || "",
    client_secret: System.get_env("GOOGLE_CLIENT_SECRET") || ""
  ],
  # Microsoft OAuth: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade
  microsoft: [
    client_id: System.get_env("MICROSOFT_CLIENT_ID") || "",
    client_secret: System.get_env("MICROSOFT_CLIENT_SECRET") || ""
  ]\n`
    ],
  ];

  return inject_file({ file, injections }, "add_auth_config_root");
};

export { add_auth_config_root };

