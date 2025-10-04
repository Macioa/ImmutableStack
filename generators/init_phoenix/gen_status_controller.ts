import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_status_controller = async ({ WebDir, AppNameCamel }: AppData) => {
  const filename = "status_controller.ex";
  const dir = join(WebDir || "", "lib", `${AppNameCamel.toLowerCase()}_web/controllers`);
  const content = `defmodule ${AppNameCamel}Web.StatusController do
  use ${AppNameCamel}Web, :controller

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

  return generateFile({ filename, dir, content }, "gen_status_controller");
};

export { gen_status_controller };
