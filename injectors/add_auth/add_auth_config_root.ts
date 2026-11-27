import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";
import { envConfigFile } from "@/utils/config_paths";

const add_auth_config_root = async ({ UmbrellaDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
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
      InjectType.REPLACE,
      /config :logger, :default_formatter,/,
      (content: string) =>
        content.includes("config :ithibati,")
          ? content
          : content.replace(/config :logger, :default_formatter,/, (logger) => `# Recovery codes issued per batch (sign-up, OAuth sign-up, Account → Recovery codes)
config :${AppNameSnake}, recovery_code_count: 12

# Passkeys, recovery codes, invitations and revocable sessions (ithibati)
config :ithibati,
  repo: ${AppNameCamel}.AuthRepo,
  user_schema: ${ApiNameCamel}.Accounts.User,
  users_key_type: :binary_id,
  invitation_schema: ${ApiNameCamel}.Accounts.Invitation

${logger}`),
    ],
  ];

  // Only prod makes the first account prove it is the operator; other envs let the first sign-up claim
  const prodInjections: Injection[] = [
    [
      InjectType.REPLACE,
      /[\s\S]*/,
      (content: string) =>
        content.includes("initial_claim")
          ? content
          : `${content.trimEnd()}

# The first account claims the instance (and the "invitations" tag) only with a
# passkey and the code from \`mix ${AppNameSnake}_${ApiNameSnake}.setup_code\`. Other envs: first sign-up wins.
config :ithibati, initial_claim: :operator_code
`,
    ],
  ];

  return Promise.all([
    inject_file({ file, injections }, "add_auth_config_root"),
    inject_file({ file: envConfigFile(UmbrellaDir, "prod"), injections: prodInjections }, "add_auth_config_root"),
  ]).then((files) => files.flat());
};

export { add_auth_config_root };

