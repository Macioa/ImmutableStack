import { join } from "path";
import { generateFile } from "..";
import { ImmutableGenerator } from "../../immutable_gen";
import { AppData } from "../../readers/get_app_data";

const gen_user_socket = async ({
LibDir, AppNameCamel
}: AppData) => {
  const filename = "user_socket.ex";
  const dir = join(LibDir || "", "lib/channels");
  const content = `defmodule ${AppNameCamel}.UserSocket do
  use Phoenix.Socket

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end`;
  return generateFile({ filename, dir, content }, "gen_user_socket");
};
export { gen_user_socket };
