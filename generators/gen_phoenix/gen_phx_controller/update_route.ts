import { StringOnlyMap, validate } from "../../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../../utils/gen_header";

const update_list = ({
  pluralNameSnake,
  context,
  genName,
  AppNameCamel,
}: StringOnlyMap) => {
  validate({ pluralNameSnake, context, genName, AppNameCamel }, "update_list");
  return `
    def update(conn, ${genName}_list) when is_list(${genName}_list) do
      with {:ok, ${pluralNameSnake}, []} <- ${context}.update_${genName}(${genName}_list) do
        render(conn, :show, ${pluralNameSnake}: ${pluralNameSnake})
      else
        {:partial_success, updated_${pluralNameSnake}, failed_${pluralNameSnake}} ->
          conn
          |> put_status(:partial_content)
          |> render(:show_partial, succeeded: updated_${pluralNameSnake}, failed: failed_${pluralNameSnake}, query_data: ${genName}_list)
  
        error ->
          ${AppNameCamel}Web.FallbackController.call(conn, error)
      end
    end
    `;
};

const update = ({ genName, context, camelName }: StringOnlyMap) => {
  validate({ genName, context, camelName }, "update");
  return `
    def update(conn, ${genName}_params) when is_map(${genName}_params) do
      with {:ok, %${camelName}{} = ${genName}} <- ${context}.update_${genName}(${genName}_params) do
        render(conn, :show, ${genName}: ${genName})
      end
    end
  `;
};

const routes: ImmRoute[] = [
  {
    id: "update_list",
    fn: update_list,
    header: (dict) => compute_header(dict, update_list),
  },
  { id: "update", fn: update, header: (dict) => compute_header(dict, update) },
];

export { routes };
