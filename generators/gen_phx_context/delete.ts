import { StringOnlyMap } from "../../utils/map";
import { compute_header } from "../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const comment_main = ({ pluralName }: StringOnlyMap, examples: string) => {
  return `
  @doc """
    Delete ${pluralName} by id.

    ## Examples
    ${examples}
    """
`;
};

const comment_many = ({ genName, genCamelName }: StringOnlyMap) => {
  return `
  ## Examples
      iex> delete_${genName}([${genName}, ${genName}])
      {:ok, [%${genCamelName}{}, %${genCamelName}{}]}
`;
};

const comment_single = ({ genName, genCamelName }: StringOnlyMap) => {
  return `
  ## Examples
      iex> delete_${genName}(${genName})
      {:ok, %${genCamelName}{}}
      iex> delete_${genName}(${genName})
      {:error, %Ecto.Changeset{}}
`;
};

const delete_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  return `
  def delete_${genName}(${pluralName}) when is_list(${pluralName}) do
    result =
      ${pluralName}
      |> Chunk.apply(fn ${genName}_chunk ->
        ids =
          Enum.map(${genName}_chunk, fn
            id when is_binary(id) -> id
            ${genName} when is_map(${genName}) -> MapUtil.get(${genName}, :id)
          end)

        {count, _} =
          from(b in ${genCamelName}, where: b.id in ^ids)
          |> Repo.delete_all()

        case count do
          0 -> {:error, 0, length(ids)}
          count when count == length(ids) -> {:ok, count, 0}
          _ -> {:partial_success, count, length(ids) - count}
        end
      end)
      |> Chunk.flat_reduce()

    if elem(result, 0) == :error,
      do: {:error, :not_found},
      else: result
  end
`;
};

const delete_single = ({ genName }: StringOnlyMap) => {
  return `
  def delete_${genName}(${genName}_params) when is_map(${genName}_params), do:  MapUtil.get(${genName}_params, :id) |> delete_${genName}
`;
};

const delete_single_by_id = ({ genName }: StringOnlyMap) => {
  return `
    def delete_${genName}(id) when is_binary(id), do: get_${genName}!(id) |> Repo.delete!    
    `;
};

const delete_apis: ImmAPI[] = [
  {
    id: "delete_many",
    fn: delete_many,
    header: (dict: StringOnlyMap) => compute_header(dict, delete_many),
  },
  {
    id: "delete_single",
    fn: delete_single,
    header: (dict: StringOnlyMap) => compute_header(dict, delete_single),
  },
  {
    id: "delete_single_by_id",
    fn: delete_single_by_id,
    header: (dict: StringOnlyMap) => compute_header(dict, delete_single_by_id),
  },
];

const comment_map: ApiIdMap = {
  delete_many: comment_many,
  delete_single: comment_single,
  delete_single_by_id: comment_single,
};

const definition_map: ApiIdMap = {
  delete_many: delete_many,
  delete_single: delete_single,
  delete_single_by_id: delete_single_by_id,
};

const gen_delete_apis: ApiGenFunction = (apis, dict) => {
  const computed_apis = delete_apis
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

export { gen_delete_apis };
