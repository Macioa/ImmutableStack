import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_user_socket = async ({ WebDir, AppNameCamel }: AppData) => {
  const filename = "user_socket.ex";
  const dir = join(WebDir || "", "lib/channels");
  const content = `defmodule ${AppNameCamel}Web.UserSocket do
  use Phoenix.Socket

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end`;
  return generateFile({ filename, dir, content }, "gen_user_socket");
};
export { gen_user_socket };
