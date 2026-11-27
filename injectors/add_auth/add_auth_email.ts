import { join } from "@/utils/path";
import { inject_file, InjectType } from "..";
import { generateFile } from "@/generators/index";
import { ApiAppData } from "@/generators/add_api";
import { EMAIL_KEYS } from "@/generators/add_auth/email_providers";
import { add_auth_mailpit, add_auth_mailpit_dockerfile, MAILPIT_UI_PORT } from "@/generators/add_auth/add_auth_mailpit";
import { gen_category_keys } from "@/generators/init_configs/gen_keys";
import { ConfigEnv, envConfigFile } from "@/utils/config_paths";

const RUNTIME_MARKER = "# Email (external_service_keys/email.exs)";

// Appends a block once, keyed by a marker string
const appendOnce = (file: string, marker: string, block: string) =>
  inject_file(
    {
      file,
      injections: [
        [InjectType.REPLACE, /[\s\S]*/, (content: string) => (content.includes(marker) ? content : `${content.trimEnd()}\n${block}`)],
      ],
    },
    "add_auth_email"
  );

const mailerModule = ({ AppNameCamel, AppNameSnake }: ApiAppData) => `defmodule ${AppNameCamel}.Mailer do
  @moduledoc "Sends email. The adapter is chosen in config/runtime.exs from external_service_keys/email.exs."
  use Swoosh.Mailer, otp_app: :${AppNameSnake}
end
`;

const add_auth_mailer = (apiAppData: ApiAppData) =>
  generateFile(
    { dir: join(apiAppData.LibDir, `lib/${apiAppData.AppNameSnake}`), filename: "mailer.ex", content: mailerModule(apiAppData) },
    "add_auth_email"
  );

// A provider key wins in every env but test; without one dev and docker use Mailpit, prod only logs
const runtimeEmail = (app: string, camel: string) => `
${RUNTIME_MARKER}: an API key switches the mailer to
# that provider. Without one, dev and docker deliver to Mailpit (:mailpit_url),
# tests keep Swoosh.Adapters.Test and prod only logs emails.
email = &key.(:email, :email, &1)
mailpit_url = Application.get_env(:${app}, :mailpit_url)

cond do
  config_env() == :test ->
    :ok

  email.(:api_key) ->
    config :${app}, ${camel}.Mailer,
      [adapter: Module.concat(Swoosh.Adapters, Macro.camelize(email.(:provider) || "postmark"))] ++
        for(name <- [:api_key, :domain], email.(name), do: {name, email.(name)})

    config :swoosh, :api_client, Swoosh.ApiClient.Req

  mailpit_url ->
    config :${app}, ${camel}.Mailer, adapter: Swoosh.Adapters.Mailpit, base_url: mailpit_url
    config :swoosh, :api_client, Swoosh.ApiClient.Req

  true ->
    config :${app}, ${camel}.Mailer, adapter: Swoosh.Adapters.Logger
    config :swoosh, :api_client, false
end

# enabled: whether features that need email (like email sign-in codes) are offered
config :${app}, :email,
  enabled: config_env() != :prod or !!email.(:api_key),
  from: {email.(:from_name) || "${camel}", email.(:from_address) || "contact@example.com"}
`;

const add_runtime_email = ({ UmbrellaDir, AppNameSnake, AppNameCamel }: ApiAppData) =>
  inject_file(
    {
      file: join(UmbrellaDir, "config", "runtime.exs"),
      injections: [
        [
          InjectType.REPLACE,
          /[\s\S]*/,
          (content: string) =>
            content.includes(RUNTIME_MARKER)
              ? content
              : content.replace(/(_ = \{key, keys\}\n)/, `$1${runtimeEmail(AppNameSnake, AppNameCamel)}`),
        ],
      ],
    },
    "add_auth_email"
  );

// Dev: the web endpoint installs and runs Mailpit (see lib/mix/processes/mailpit.ex)
const devEmail = ({ AppNameSnake, AppNameCamel }: ApiAppData) => `
# Email: without an email key, mail goes to Mailpit at http://localhost:${MAILPIT_UI_PORT}.
# The web endpoint downloads (once) and runs it in dev only.
config :${AppNameSnake}, :mailpit_url, "http://localhost:${MAILPIT_UI_PORT}"

config :${AppNameSnake}_web, ${AppNameCamel}Web.Endpoint,
  watchers: [mailpit: {${AppNameCamel}.Mailpit, :install_and_run, []}]
`;

// Docker: Mailpit is its own compose service (docker/mailpit.dockerfile)
const dockerEmail = ({ AppNameSnake }: ApiAppData) => `
# Email: without an email key, mail goes to the ${AppNameSnake}_mailpit compose service
# (inbox at http://localhost:${MAILPIT_UI_PORT}).
config :${AppNameSnake}, :mailpit_url, "http://${AppNameSnake}_mailpit:${MAILPIT_UI_PORT}"
`;

const testEmail = ({ AppNameSnake, AppNameCamel }: ApiAppData) => `
# Email: tests capture mail in the process (Swoosh.TestAssertions); nothing is sent
config :${AppNameSnake}, ${AppNameCamel}.Mailer, adapter: Swoosh.Adapters.Test
config :swoosh, :api_client, false
`;

const envBlocks: [ConfigEnv, (apiAppData: ApiAppData) => string][] = [
  ["dev", devEmail],
  ["docker", dockerEmail],
  ["test", testEmail],
];

const add_env_email = (apiAppData: ApiAppData) =>
  Promise.all(
    envBlocks.map(([env, block]) => appendOnce(envConfigFile(apiAppData.UmbrellaDir, env), "# Email:", block(apiAppData)))
  );

const composeService = (app: string) => `
  ${app}_mailpit:
    build:
      context: .
      dockerfile: mailpit.dockerfile
    restart: unless-stopped
    ports:
      - "${MAILPIT_UI_PORT}:${MAILPIT_UI_PORT}"
`;

// Adds the Mailpit service and makes the dev container wait for it
const add_compose_mailpit = ({ UmbrellaDir, AppNameSnake }: ApiAppData) =>
  inject_file(
    {
      file: join(UmbrellaDir, "docker", "compose.yaml"),
      injections: [
        [
          InjectType.REPLACE,
          /[\s\S]*/,
          (content: string) =>
            content.includes(`${AppNameSnake}_mailpit:`)
              ? content
              : content
                  .replace(`    depends_on:\n      - ${AppNameSnake}_db\n`, `    depends_on:\n      - ${AppNameSnake}_db\n      - ${AppNameSnake}_mailpit\n`)
                  .replace(/\nvolumes:\n/, `${composeService(AppNameSnake)}\nvolumes:\n`),
        ],
      ],
    },
    "add_auth_email"
  );

// Sequential: several of these files are also edited by other add_auth injectors
const add_auth_email = async (apiAppData: ApiAppData) => [
  await add_auth_mailer(apiAppData),
  await add_auth_mailpit(apiAppData),
  await add_auth_mailpit_dockerfile(apiAppData),
  await gen_category_keys(apiAppData, EMAIL_KEYS),
  await add_runtime_email(apiAppData),
  await add_env_email(apiAppData),
  await add_compose_mailpit(apiAppData),
];

export { add_auth_email };
