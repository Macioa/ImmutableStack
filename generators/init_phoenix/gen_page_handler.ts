import { join } from "path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_page_controller = async ({
  AppNameSnake,
  AppNameCamel,
  WebDir,
}: AppData) => {
  const controllersPath = join(WebDir, `/lib/${AppNameSnake}_web/controllers`);

  const content = `
defmodule ${AppNameCamel}Web.PageController do
  use ${AppNameCamel}Web, :controller

  def index(conn, _params) do
    # Serve the static index.html file
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, Path.join([:code.priv_dir(:${AppNameSnake}_web), "static", "index.html"]))
  end
end

`;

  return generateFile(
    {
      dir: controllersPath,
      filename: "page_controller.ex",
      content,
    },
    "gen_page_controller"
  );
};

export { gen_page_controller };
