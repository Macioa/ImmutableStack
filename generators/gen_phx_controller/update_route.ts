import { StringOnlyMap } from "../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../utils/gen_header";

const update_list = ({
  pluralName,
  context,
  genName,
  AppNameCamel,
}: StringOnlyMap) => {
  return `
    def update(conn, ${genName}_list) when is_list(${genName}_list) do
      with {:ok, ${pluralName}, []} <- ${context}.update_${genName}(${genName}_list) do
        render(conn, :show, ${pluralName}: ${pluralName})
      else
        {:partial_success, updated_${pluralName}, failed_${pluralName}} ->
          conn
          |> put_status(:partial_content)
          |> render(:show_partial, succeeded: updated_${pluralName}, failed: failed_${pluralName}, query_data: ${genName}_list)
  
        error ->
          ${AppNameCamel}Web.FallbackController.call(conn, error)
      end
    end
    `;
};

const update = ({ genName, context, camelName }: StringOnlyMap) => {
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
