import { join } from "path";
import {
  ImmutableGenerator,
  ImmutableController,
  ImmutableContext,
} from "../../gen_controller";
import { generateFile } from "../..";
import { StringOnlyMap } from "../../../utils/map";
import { routes as show_routes } from "./show_route";
import { routes as index_routes } from "./index_route";
import { routes as create_routes } from "./create_route";
import { routes as update_routes } from "./update_route";
import { routes as delete_routes } from "./delete_route";
import { route as custom_route } from "./custom_route";
import { gen_fallback_controller } from "./gen_fallback_controller";
import { gen_json_handler } from "./gen_json_handler";
import { log } from "../../../utils/logger";

const route_data = [
  show_routes,
  index_routes,
  create_routes,
  update_routes,
  delete_routes,
].flat();

const gen_routes = (
  requested_routes: string[],
  route_data: ImmRoute[],
  gen_ref_data: StringOnlyMap,
) => {
  log({ level: 7 }, "Requested Routes: ", requested_routes);
  const route_data_computed: { [key: string]: string } = route_data.reduce(
    (acc, route) => {
      return { ...acc, [route.header(gen_ref_data)]: route.fn(gen_ref_data) };
    },
    {},
  );
  log({ level: 7 }, "Route Data Computed: ", route_data_computed);
  return requested_routes
    .map((header) => {
      log({ level: 7 }, "Header: ", header);
      return route_data_computed[header] || custom_route.fn({ header });
    })
    .join("\n\n");
};

const gen_phx_controller = async (
  generator: ImmutableGenerator,
  _typeDict: any,
) => {
  const {
    AppNameSnake,
    AppNameCamel,
    WebDir,
    generate,
    name: genName,
    camelName,
    pluralName,
  } = generator;
  const { name, routes } = generate.http_controller as ImmutableController;
  const { name: contextName } = generate.context as ImmutableContext;
  const controllerPath = join(
    WebDir || "",
    `/lib/${AppNameSnake}_web/controllers/`,
  );
  const snakeController = name
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();

  const dict: StringOnlyMap = {
    camelName: camelName || "",
    genName,
    context: contextName,
    pluralName: pluralName || "",
    AppNameCamel: AppNameCamel || "",
    camelUpperName: camelName || "",
  };
  log({ level: 7 }, "Generating controller: ", name, snakeController, dict);

  const content = `
defmodule ${AppNameCamel}Web.${name} do
use ${AppNameCamel}Web, :controller
plug ${AppNameCamel}.Plugs.ListAsJSON

alias ${AppNameCamel}.Utils.Paginate
alias ${AppNameCamel}.Utils.MapUtil

alias ${AppNameCamel}.${contextName}
alias ${AppNameCamel}.${camelName}

action_fallback ${AppNameCamel}Web.FallbackController

def index(conn, params) do
    {entity_queries, page_queries} = Paginate.split_page_opts(params)
    routed_index(conn, entity_queries, page_queries)
end

${gen_routes(routes, route_data, dict)}

end
`;

  return generateFile(
    {
      dir: controllerPath,
      filename: `${snakeController}.ex`,
      content,
    },
    "gen_phx_controller",
  );
};

interface ImmRoute {
  id?: string;
  fn: (args: StringOnlyMap) => string;
  header: (args: StringOnlyMap) => string;
}
export type { ImmRoute };
export { gen_phx_controller, gen_fallback_controller, gen_json_handler };
