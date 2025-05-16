import { join } from "../../utils/path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";
import { Names } from "../../immutable_gen";

const gen_phx_channel = (
  { singleSnake, singleUpperCamel }: Names,
  { WebDir, AppNameCamel }: AppData
) => {
  const filename = `${singleSnake}_channel.ex`;
  const dir = join(WebDir, "lib/channels");
  const content = `defmodule ${AppNameCamel}Web.${singleUpperCamel}Channel do
  use ${AppNameCamel}Web, :channel

  def join("${singleSnake}:" <> _room_id, _params, socket) do
    {:ok, socket}
  end

  def handle_in("message", %{"body" => body}, socket) do
    broadcast!(socket, "message", %{
      body: body,
    })

    {:noreply, socket}
  end
end`;
  return generateFile({ filename, dir, content }, "gen_phx_channel");
};

export { gen_phx_channel };
