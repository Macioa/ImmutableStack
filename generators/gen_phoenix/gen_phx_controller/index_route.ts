import { StringOnlyMap, validate } from "../../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../../utils/gen_header";

const index_standard = ({ pluralNameSnake, context }: StringOnlyMap) => {
  validate({ pluralNameSnake, context }, "index_standard");
  return `
    defp routed_index(conn, entity_queries, page_queries) when entity_queries == %{} do
      with {:ok, ${pluralNameSnake}, query_data} <- ${context}.list_${pluralNameSnake}(page_queries) do
        render(conn, :show, ${pluralNameSnake}: ${pluralNameSnake}, query_data: query_data)
      end
    end
  `;
};

const index_dynamic = ({ pluralNameSnake, context }: StringOnlyMap) => {
  validate({ pluralNameSnake, context }, "index_dynamic");
  return `
    defp routed_index(conn, entity_queries, page_queries) when entity_queries != %{} do
      with {:ok, ${pluralNameSnake}, query_data} <- ${context}.list_${pluralNameSnake}_by(entity_queries, page_queries) do
        render(conn, :show, ${pluralNameSnake}: ${pluralNameSnake}, query_data: query_data)
      end
    end
  `;
};

const routes: ImmRoute[] = [
  {
    id: "index_standard",
    fn: index_standard,
    header: (dict) => compute_header(dict, index_standard),
  },
  {
    id: "index_dynamic",
    fn: index_dynamic,
    header: (dict) => compute_header(dict, index_dynamic),
  },
];

export { routes };
