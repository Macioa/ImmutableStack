import { join } from "../../utils/path";
import { Injection, InjectType, inject_file } from "..";
import { Names } from "../../immutable_gen";
import { AppData } from "../../readers/get_app_data";

const inject_channel_to_socket = async (
  { singleUpperCamel, singleSnake }: Names,
  { WebDir, AppNameCamel }: AppData
) => {
  const file = join(WebDir || "", "lib/channels/user_socket.ex");
  const content = `\nchannel "${singleSnake}:*", ${AppNameCamel}Web.${singleUpperCamel}Channel\n`;
  const injections: Injection[] = [
    [InjectType.AFTER, /use\sPhoenix.Socket/gm, content],
  ];
  return inject_file(
    {
      file,
      injections,
    },
    "inject_channel_to_socket"
  );
};
export { inject_channel_to_socket };
