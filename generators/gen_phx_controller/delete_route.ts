import { StringOnlyMap } from "../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../utils/gen_header";

const delete_list = ({
  pluralName,
  context,
  genName,
  AppNameCamel,
}: StringOnlyMap) => {
  return `
    def delete(conn, ${pluralName}_list) when is_list(${pluralName}_list) do
      with {:ok, count, _} <- ${context}.delete_${genName}(${pluralName}) do
        render(conn, :show, count: count)
      else
        {:partial_success, success_count, fail_count} ->
          conn
          |> put_status(:partial_content)
          |> render(:show_partial, succeess_count: success_count, fail_count: fail_count)
  
        e ->
          ${AppNameCamel}Web.FallbackController.call(conn, e)
      end
    end
  `;
};

const deleted = ({ genName, context, camelUpperName }: StringOnlyMap) => {
  return `
    def delete(conn, %{"id" => id}) do
      with {:ok, %${camelUpperName}{}} <- ${context}.delete_${genName}(id) do
        send_resp(conn, :no_content, "")
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
