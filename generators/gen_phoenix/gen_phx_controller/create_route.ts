import { StringOnlyMap, validate } from "../../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../../utils/gen_header";

const create_list = ({
  genName,
  context,
  pluralNameSnake,
  AppNameCamel,
}: StringOnlyMap) => {
  validate({ genName, context, pluralNameSnake, AppNameCamel }, "create_list");
  return `
    def create(conn, ${genName}_list) when is_list(${genName}_list) do
      with {:ok, ${pluralNameSnake}, []} <- ${context}.create_${genName}(${genName}_list) do
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/${genName}")
        |> render(:show, ${pluralNameSnake}: ${pluralNameSnake})
      else
        {:partial_success, created_${pluralNameSnake}, failed_${pluralNameSnake}} ->
          conn
          |> put_status(:partial_content)
          |> render(:show_partial, succeeded: created_${pluralNameSnake}, failed: failed_${pluralNameSnake}, query_data: ${genName}_list)
  
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
  pluralNameSnake,
}: StringOnlyMap) => {
  validate({ genName, camelUpperName, context, pluralNameSnake }, "create");
  return `
    def create(conn, ${genName}_params) do
      with {:ok, %${camelUpperName}{} = ${genName}} <- ${genName}_params |> MapUtil.str_to_atom() |> ${context}.create_${genName}() do
        conn
        |> put_status(:created)
        |> put_resp_header("location", ~p"/api/${genName}/#{${genName}.id}")
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
