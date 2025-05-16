import { join } from "../../utils/path";
import { Injection, InjectType, inject_file } from "..";
import { AppData } from "../../readers/get_app_data";

const inject_socket_to_endpoint = async ({
  WebDir,
  AppNameCamel,
  AppNameSnake,
}: AppData) => {
  const file = join(WebDir || "", `lib/${AppNameSnake}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /\s*use\sPhoenix.Endpoint,\sotp_app:\s:\w+_web/gm,
      `\nsocket "/socket", ${AppNameCamel}Web.UserSocket,
  websocket: true,
  longpoll: false\n`,
    ],
  ];
  return inject_file({ file, injections }, "inject_socket_to_endpoint");
};
export { inject_socket_to_endpoint };
