import { StringOnlyMap, validate } from "../../../utils/map";
import { compute_header } from "../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const comment_standard = ({ pluralName, genCamelName }: StringOnlyMap) => {
  validate({ pluralName, genCamelName }, "comment_standard");
  return `
@doc """
Returns the list of ${pluralName}.

## Examples
    iex> list_${pluralName}()
    [%${genCamelName}{}, ...]

"""
    `;
};

const list_standard = ({ pluralName, genCamelName }: StringOnlyMap) => {
  validate({ pluralName, genCamelName }, "list_standard");
  return `
    def list_${pluralName}(page_query \\\\ %{}), do: Paginate.apply(${genCamelName}, Repo, page_query)
    `;
};

const comment_dynamic = ({ pluralName, genCamelName }: StringOnlyMap) => {
  validate({ pluralName, genCamelName }, "comment_dynamic");
  return `
@doc """
Use a Dynamic Query to get a list of ${pluralName} with specific values for any directly queryable fields.
"""
    `;
};

const list_dynamic = ({ pluralName, genCamelName }: StringOnlyMap) => {
  validate({ pluralName, genCamelName }, "list_dynamic");
  return `
def list_${pluralName}_by(entity_queries, page_queries \\\\ %{}) do
  with {:ok, query, entity_queries} <- DynamicQuery.by_schema(entity_queries, ${genCamelName}),
       {:ok, result, page_queries} <- Paginate.apply(query, Repo, page_queries) do
    {:ok, result, Map.put(entity_queries, :page, page_queries)}
  end
end
`;
};

const list_apis: ImmAPI[] = [
  {
    id: "list_standard",
    fn: list_standard,
    header: (dict: StringOnlyMap) => compute_header(dict, list_standard),
  },
  {
    id: "list_dynamic",
    fn: list_dynamic,
    header: (dict: StringOnlyMap) => compute_header(dict, list_dynamic),
  },
];

const comment_map: ApiIdMap = {
  list_standard: comment_standard,
  list_dynamic: comment_dynamic,
};

const definition_map: ApiIdMap = {
  list_standard: list_standard,
  list_dynamic: list_dynamic,
};

const gen_list_apis: ApiGenFunction = (apis, dict) => {
  const computed_apis = list_apis
    .map(({ id, fn, header }) => ({ id, def: fn(dict), header: header(dict) }))
    .filter(({ header }) => apis.includes(header));
  const requested_ids = computed_apis.map(({ id }) => id || "");
  return {
    result: requested_ids
      .map((id) => comment_map[id](dict) + "\n" + definition_map[id](dict))
      .join("\n"),
    remaining_apis: apis.filter(
      (api) => !computed_apis.map(({ header }) => header).includes(api),
    ),
  };
};

export { gen_list_apis };
