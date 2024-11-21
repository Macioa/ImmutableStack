import { join } from "path";
import { generateFile } from "../index";

const gen_page_controller = async (AppName: string, AppNameCamel: string, WebDir: string) => {
  const controllersPath = join(WebDir, `/lib/${AppName}_web/controllers`);

  const content = `
defmodule ${AppNameCamel}Web.PageController do
  use ${AppNameCamel}Web, :controller

  def index(conn, _params) do
    # Serve the static index.html file
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, Path.join([:code.priv_dir(:${AppName}_web), "static", "index.html"]))
  end
end

`;

  return generateFile({
    dir: controllersPath,
    filename: "page_controller.ex",
    content,
  });
};

export { gen_page_controller };
