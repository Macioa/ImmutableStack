import { StringOnlyMap } from "../../utils/map";
import { ImmRoute } from "./";
import { compute_header } from "../../utils/gen_header";

const create_list = ({
  genName,
  context,
  pluralName,
  AppNameCamel,
}: StringOnlyMap) => {
  return `
    def create(conn, ${genName}_list) when is_list(${genName}_list) do
      with {:ok, ${pluralName}, []} <- ${context}.create_${genName}(${genName}_list) do
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/${pluralName}/:id")
        |> render(:show, ${pluralName}: ${pluralName})
      else
        {:partial_success, created_${pluralName}, failed_${pluralName}} ->
          conn
          |> put_status(:partial_content)
          |> render(:show_partial, succeeded: created_${pluralName}, failed: failed_${pluralName})
  
        error ->
          ${AppNameCamel}Web.FallbackController.call(conn, error)
      end
    end
    `;
};

const create = ({
  genName,
  camelUpperName,
  context,
  pluralName,
}: StringOnlyMap) => {
  return `
    def create(conn, ${genName}_params) do
      with {:ok, %${camelUpperName}{} = ${genName}} <- ${genName}_params |> MapUtil.str_to_atom() |> ${context}.create_${genName}() do
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/${pluralName}/#{${genName}}")
        |> render(:show, ${genName}: ${genName})
      end
    end
    `;
};

const routes: ImmRoute[] = [
  {
    id: "create_list",
    fn: create_list,
    header: (dict: StringOnlyMap) => compute_header(dict, create_list),
  },
  {
    id: "create",
    fn: create,
    header: (dict: StringOnlyMap) => compute_header(dict, create),
  },
];

export { routes };
