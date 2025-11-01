import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./add_api_endpoint";

const add_api_user_socket = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "user_socket.ex";
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/channels`);
  const content = `defmodule ${ApiNameCamel}.UserSocket do
  use Phoenix.Socket

  def connect(_params, socket, _connect_info) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end`;
  return generateFile({ filename, dir, content }, "add_api_user_socket");
};

export { add_api_user_socket };

