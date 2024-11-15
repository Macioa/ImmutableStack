import { StringOnlyMap } from "../../../utils/map";
import { compute_header } from "../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";
import { disconnect } from "process";

const comment_main = ({ pluralName }: StringOnlyMap, examples: string) => {
  return `
@doc """
    Retrieve ${pluralName} by id.

    ## Examples
  ${examples}
"""
  `;
};

const comment_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  return `
    get_${genName}!(ids) when is_list(ids) -> Gets specified ${pluralName}.
    
    iex> get_${genName}!([123, 456])
      [%${genCamelName}{}, %${genCamelName}{}]
      %${genCamelName}{}
`;
};

const comment_single = ({ genName, genCamelName }: StringOnlyMap) => {
  return `
  get_${genName}!(id) -> Gets a single ${genName}.
      Raises \`Ecto.NoResultsError\` if the ${genCamelName} does not exist.

  ## Examples
      iex> get_${genName}!(123)
      %${genCamelName}{}
      iex> get_${genName}!(456)
      ** (Ecto.NoResultsError)    
`;
};

const get_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  return `
  def get_${genName}!(${pluralName}) when is_list(${pluralName}) do
    ids =
      Enum.map(${pluralName}, fn
        id when is_binary(id) -> id
        ${genName} when is_map(${genName}) -> MapUtil.get(${genName}, :id)
      end)

    from(b in ${genCamelName}, where: b.id in ^ids)
    |> Repo.all()
  end
`;
};

const get_single = ({ genName, genCamelName }: StringOnlyMap) => {
  return `
  def get_${genName}!(${genName}_params) when is_map(${genName}_params) do
    id = MapUtil.get(${genName}_params, :id) 
    Repo.get!(${genCamelName}, id)
  end
    `;
};

const get_single_by_id = ({ genName, genCamelName }: StringOnlyMap) => {
    return `
  def get_${genName}!(id) when is_binary(id), do: Repo.get!(${genCamelName}, id)    
`
}

const get_apis: ImmAPI[] = [
  {
    id: "get_many",
    fn: get_many,
    header: (dict: StringOnlyMap) => compute_header(dict, get_many),
  },
  {
    id: "get_single",
    fn: get_single,
    header: (dict: StringOnlyMap) => compute_header(dict, get_single),
  },
  {
    id: "get_single_by_id",
    fn: get_single_by_id,
    header: (dict: StringOnlyMap) => compute_header(dict, get_single_by_id),
  }
];

const comment_map: ApiIdMap = {
  get_many: comment_many,
  get_single: comment_single,
  get_single_by_id: comment_single,
};

const definition_map: ApiIdMap = {
  get_many: get_many,
  get_single: get_single,
  get_single_by_id: get_single_by_id,
};

const gen_get_apis: ApiGenFunction = (apis, dict) => {
  const computed_apis = get_apis
    .map(({ id, fn, header }) => ({ id, def: fn(dict), header: header(dict) }))
    .filter(({ header }) => apis.includes(header));
  const requested_ids = computed_apis.map(({ id }) => id || "");
  const examples = requested_ids.map((id) => comment_map[id](dict)).join("\n");
  const comments = comment_main(dict, examples);
  const definitions = requested_ids
    .map((id) => definition_map[id](dict))
    .join("\n");

  return {
    result: comments + "\n" + definitions,
    remaining_apis: apis.filter(
      (api) => !computed_apis.map(({ header }) => header).includes(api)
    ),
  };
};

export { gen_get_apis };
