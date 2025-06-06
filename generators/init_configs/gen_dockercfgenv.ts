import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_docker_config_env = async ({
  UmbrellaDir,
  AppNameCamel,
  AppNameSnake,
}: AppData) => {
  const filename = "docker.exs";
  let dir = UmbrellaDir || "";
  dir = join(dir, "config");
  const content = `import Config

# Set UI variables
config :${AppNameSnake}, :ui,
  app_name: "${AppNameCamel}",
  API_URL: "http://localhost:4000/api/",
  SOCKET_URL: "ws://localhost:4000/socket"

# Configure your database
config :${AppNameSnake}, ${AppNameCamel}.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "${AppNameSnake}_db",
  database: "${AppNameSnake}_db",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

# For development, we disable any cache and enable
# debugging and code reloading.
#
# The watchers configuration can be used to run external
# watchers to your application. For example, we can use it
# to bundle .js and .css sources.
config :${AppNameSnake}, CORSPlug, origin: "*"

config :${AppNameSnake}_web, ${AppNameCamel}Web.Endpoint,
  # Binding to loopback ipv4 address prevents access from other machines.
  # Change to \`ip: {0, 0, 0, 0}\` to allow access from other machines.
  http: [ip: {0, 0, 0, 0}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "gU20Dle/0HOrq6LTY4AdzGi8GZ9kGO28xbIEhQmGTKA0D9mJQwbtFbUxL5Y9Oyj6",
  watchers: []

# ## SSL Support
#
# In order to use HTTPS in development, a self-signed
# certificate can be generated by running the following
# Mix task:
#
#     mix phx.gen.cert
#
# Run \`mix help phx.gen.cert\` for more information.
#
# The \`http:\` config above can be replaced with:
#
#     https: [
#       port: 4001,
#       cipher_suite: :strong,
#       keyfile: "priv/cert/selfsigned_key.pem",
#       certfile: "priv/cert/selfsigned.pem"
#     ],
#
# If desired, both \`http:\` and \`https:\` keys can be
# configured to run both http and https servers on
# different ports.

# Enable dev routes for dashboard and mailbox
config :${AppNameSnake}_web, dev_routes: true

# Do not include metadata nor timestamps in development logs
config :logger, :console, format: "[$level] $message\n"

# Initialize plugs at runtime for faster development compilation
config :phoenix, :plug_init_mode, :runtime

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# Set a higher stacktrace during development. Avoid configuring such
# in production as building large stacktraces may be expensive.
config :phoenix, :stacktrace_depth, 20
`;

  return generateFile(
    {
      filename,
      dir,
      content,
    },
    "gen_docker_config_env"
  );
};

export { gen_docker_config_env };
