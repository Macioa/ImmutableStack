import { StringOnlyMap } from "../../../utils/map";
import { ImmRoute } from ".";
import { compute_header } from "../../../utils/gen_header";

const index_standard = ({ pluralName, context }: StringOnlyMap) => {
  return `
    defp routed_index(conn, entity_queries, page_queries) when entity_queries == %{} do
      with {:ok, ${pluralName}, query_data} <- ${context}.list_${pluralName}(page_queries) do
        render(conn, :show, ${pluralName}: ${pluralName}, query_data: query_data)
      end
    end
  `;
};

const index_dynamic = ({ pluralName, context }: StringOnlyMap) => {
  return `
    defp routed_index(conn, entity_queries, page_queries) when entity_queries != %{} do
      with {:ok, ${pluralName}, query_data} <- ${context}.list_${pluralName}_by(entity_queries, page_queries) do
        render(conn, :show, ${pluralName}: ${pluralName}, query_data: query_data)
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
