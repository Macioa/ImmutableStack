import { join } from "../../utils/path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";
import { Names } from "../../immutable_gen";

const gen_phx_channel = (
  { singleSnake, singleUpperCamel }: Names,
  { LibDir, AppNameCamel }: AppData
) => {
  const filename = `${singleSnake}_channel.ex`;
  const dir = join(LibDir, "lib/channels");
  const content = `defmodule ${AppNameCamel}.${singleUpperCamel}Channel do
  use ${AppNameCamel}, :channel

  def join("room:lobby", _payload, socket) do
    {:ok, socket}
  end

  def handle_in("message", %{"body" => body}, socket) do
    broadcast!(socket, "message", %{
      body: body,
      user: socket.assigns[:user_id] || "anonymous"
    })

    {:noreply, socket}
  end
end`;
  return generateFile({ filename, dir, content }, "gen_phx_channel");
};

export { gen_phx_channel };
