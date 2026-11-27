import { join } from "@/utils/path";
import { inject_file, Injection, InjectType } from "..";
import { ApiAppData } from "@/generators/add_api";

const API_PIPELINE = /(pipeline :api do\s*\n\s*plug\(:accepts, \["json"\]\)\n)/;
const OPEN_CONNECT = /def connect\(_params, socket, _connect_info\) do\s*\{:ok, socket\}\s*end/;

const once = (marker: string, apply: (content: string) => string) => (content: string) =>
  content.includes(marker) ? content : apply(content);

const required = (pattern: RegExp, file: string) => (content: string) => {
  if (!pattern.test(content)) throw new Error(`${pattern} not found in ${file}`);
  return content;
};

// The web API runs on its own endpoint, so it checks the auth app's bearer tokens directly
const add_auth_web_api_auth = async ({ WebDir, AppNameSnake, AppNameCamel, ApiNameSnake }: ApiAppData) => {
  const authApp = `${AppNameSnake}_${ApiNameSnake}`;
  const plug = `${AppNameCamel}Web.Plugs.ApiAuth`;
  const mixFile = join(WebDir || "", "mix.exs");
  const routerFile = join(WebDir || "", `lib/${AppNameSnake}_web/router.ex`);
  const socketFile = join(WebDir || "", "lib/channels/user_socket.ex");
  const appDep = new RegExp(`(\\{:${AppNameSnake}, in_umbrella: true\\},\\n)`);

  const edit = (file: string, marker: string, pattern: RegExp, apply: (content: string) => string): Injection[] => [
    [InjectType.REPLACE, pattern, once(marker, (content) => apply(required(pattern, file)(content)))],
  ];

  return Promise.all([
    inject_file(
      {
        file: mixFile,
        injections: edit(mixFile, `{:${authApp}, in_umbrella: true}`, appDep, (content) =>
          content.replace(appDep, `$1      {:${authApp}, in_umbrella: true},\n`)
        ),
      },
      "add_auth_web_api_auth"
    ),
    inject_file(
      {
        file: routerFile,
        injections: edit(routerFile, plug, API_PIPELINE, (content) =>
          content.replace(API_PIPELINE, `$1    plug(${plug})\n`)
        ),
      },
      "add_auth_web_api_auth"
    ),
    inject_file(
      {
        file: socketFile,
        injections: edit(socketFile, plug, OPEN_CONNECT, (content) =>
          content.replace(
            OPEN_CONNECT,
            `def connect(params, socket, _connect_info) do
    case ${plug}.user_from_token(params["token"]) do
      nil -> :error
      user -> {:ok, assign(socket, :current_user, user)}
    end
  end`
          )
        ),
      },
      "add_auth_web_api_auth"
    ),
  ]);
};

export { add_auth_web_api_auth };
