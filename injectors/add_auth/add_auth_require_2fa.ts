import { inject_file, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";
import { CONFIG_ENVS, envConfigFile } from "@/utils/config_paths";

const MARKER = "require_2fa:";

// Off by default in every env; see Accounts.TwoFactor.server_required?/0
const require2fa = (AppNameSnake: string) => `
# Two-factor for every account: when true, email codes count as on for everyone
# (they can also use an authenticator app), sign-in always asks for a second factor,
# and new or changed emails must be verified. Accounts keep their own settings for
# when this is turned off again.
config :${AppNameSnake}, require_2fa: false
`;

const add_auth_require_2fa = ({ UmbrellaDir, AppNameSnake }: ApiAppData) =>
  Promise.all(
    CONFIG_ENVS.map((env) =>
      inject_file(
        {
          file: envConfigFile(UmbrellaDir, env),
          injections: [
            [
              InjectType.REPLACE,
              /[\s\S]*/,
              (content: string) => (content.includes(MARKER) ? content : `${content.trimEnd()}\n${require2fa(AppNameSnake)}`),
            ],
          ],
        },
        "add_auth_require_2fa"
      )
    )
  );

export { add_auth_require_2fa };
