import { StringOnlyMap, validate } from "../../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../../utils/gen_header";

const delete_list = ({
  pluralName,
  context,
  genName,
  AppNameCamel,
}: StringOnlyMap) => {
  validate({ pluralName, context, genName, AppNameCamel }, delete_list);
  return `
    def delete(conn, ${genName}_list) when is_list(${genName}_list) do
      with {:ok, count, _} <- ${context}.delete_${genName}(${genName}_list) do
        render(conn, :show, count: count)
      else
        {:partial_success, success_count, fail_count} ->
          conn
          |> put_status(:partial_content)
          |> render(:show_partial, succeess_count: success_count, fail_count: fail_count, query_data: ${genName}_list)
  
        e ->
          ${AppNameCamel}Web.FallbackController.call(conn, e)
      end
    end
  `;
};

const deleted = ({ genName, context, camelUpperName }: StringOnlyMap) => {
  return `
    def delete(conn, %{"id" => id}) do
      with %${camelUpperName}{} = ${genName} <- ${context}.delete_${genName}(id) do
        conn
        |> put_status(:ok)
        |> render(:show, ${genName}: ${genName})
      end
    end 
  `;
};

const routes: ImmRoute[] = [
  {
    id: "delete_list",
    fn: delete_list,
    header: (dict) => compute_header(dict, delete_list),
  },
  {
    id: "delete",
    fn: deleted,
    header: (dict) => compute_header(dict, deleted),
  },
];

export { routes };
