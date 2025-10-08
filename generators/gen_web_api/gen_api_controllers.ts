import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./gen_api_endpoint";

const gen_api_error_json = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "error_json.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web/controllers`);
  const content = `defmodule ${ApiNameCamel}.ErrorJSON do
  def render(template, _assigns) do
    %{errors: %{detail: Phoenix.Controller.status_message_from_template(template)}}
  end
end`;

  return generateFile({ filename, dir, content }, "gen_api_error_json");
};

const gen_api_fallback_controller = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "fallback_controller.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web/controllers`);
  const content = `defmodule ${ApiNameCamel}.FallbackController do
  use ${ApiNameCamel}, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: ${ApiNameCamel}.ChangesetJSON)
    |> render(:error, changeset: changeset)
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: ${ApiNameCamel}.ErrorJSON)
    |> render(:"404")
  end
end`;

  return generateFile({ filename, dir, content }, "gen_api_fallback_controller");
};

const gen_api_page_controller = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "page_controller.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web/controllers`);
  const content = `defmodule ${ApiNameCamel}.PageController do
  use ${ApiNameCamel}, :controller
  
  def index(conn, _params) do
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, Path.join([:code.priv_dir(:${apiAppName}), "static", "index.html"]))
  end
end`;

  return generateFile({ filename, dir, content }, "gen_api_page_controller");
};

const gen_api_status_controller = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "status_controller.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web/controllers`);
  const content = `defmodule ${ApiNameCamel}.StatusController do
  use ${ApiNameCamel}, :controller

  def index(conn, _params) do
    nodes = Node.list()
    current_node = Node.self()
    
    status = %{
      current_node: current_node,
      connected_nodes: nodes,
      total_nodes: length(nodes) + 1,
      cluster_status: "active"
    }
    
    json(conn, status)
  end
end`;

  return generateFile({ filename, dir, content }, "gen_api_status_controller");
};

export { gen_api_error_json, gen_api_fallback_controller, gen_api_page_controller, gen_api_status_controller };

