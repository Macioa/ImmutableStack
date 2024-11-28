import { StringOnlyMap, validate } from "../../../utils/map";
import { compute_header } from "../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const comment_main = ({ pluralName }: StringOnlyMap, examples: string) => {
  validate({ pluralName }, "comment_main");
  return `
  @doc """
    Update ${pluralName} records.

    ## Examples
    ${examples}
    """
`;
};

const comment_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  validate({ genName, pluralName, genCamelName }, "comment_many");
  return `
update_${genName}(${pluralName}) when is_list ${pluralName} -> Updates ${pluralName} with an array of tuples [{${genName}, attrs}].

## Examples
    iex> update_${genName}([{%{field: new_value}}, {%{field: new_value}}])
    {:ok, [%${genCamelName}{}, %${genCamelName}{}]}
`;
};

const comment_single = ({ genName, genCamelName }: StringOnlyMap) => {
  validate({ genName, genCamelName }, "comment_single");
  return `
update_${genName}(%${genCamelName}{} = ${genName}, attrs) -> Updates a ${genName}.

## Examples
    iex> update_${genName}(${genName}, %{field: new_value})
    {:ok, %${genCamelName}{}}
    iex> update_${genName}(${genName}, %{field: bad_value})
    {:error, %Ecto.Changeset{}}
`;
};

const update_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  validate({ genName, pluralName, genCamelName }, "update_many");
  return `
def update_${genName}(${pluralName}) when is_list(${pluralName}) do
  ${pluralName}
  |> Chunk.apply(fn ${genName}_chunk ->
    multi =
      Multi.new()
      |> Multi.run(:initial_query, fn repo, _ ->
        requested_ids = Enum.map(${genName}_chunk, &MapUtil.get(&1, :id))

        found_${pluralName} = from(b in ${genCamelName}, where: b.id in ^requested_ids) |> repo.all()
        found_ids = Enum.map(found_${pluralName}, & &1.id)
        unfound_ids = requested_ids -- found_ids

        {matched_attrs, unmatched_attrs} =
          Enum.split_with(${genName}_chunk, fn attrs -> MapUtil.get(attrs, :id) not in unfound_ids end)

        changesets =
          Enum.zip(found_${pluralName}, matched_attrs)
          |> Enum.map(fn {${genName}, attrs} -> change_${genName}(${genName}, attrs) end)
          |> Enum.filter(& &1.valid?)

        {:ok, %{changesets: changesets, unmatched: unmatched_attrs}}
      end)
      |> Multi.run(:updates, fn repo, %{initial_query: query_res} ->
        %{
          changesets: changesets,
          unmatched: unmatched_attrs
        } = query_res

        {succeeded, failed_updates} =
          changesets
          |> Enum.map(&repo.update/1)
          |> Enum.reduce({[], []}, fn
            {:ok, ${genName}}, {s, f} -> {[${genName} | s], f}
            {_, changeset}, {s, f} -> [s, changeset | f]
          end)

        {:ok, %{succeeded: succeeded, failed: failed_updates ++ unmatched_attrs}}
      end)

    {:ok, %{updates: updates}} = Repo.transaction(multi)
    %{succeeded: succeeded, failed: failed} = updates

    case {succeeded, failed} do
      {succeeded, []} -> {:ok, succeeded, []}
      {[], failed} -> {:error, [], failed}
      {succeeded, failed} -> {:partial_success, succeeded, failed}
    end
  end)
  |> Chunk.flat_reduce()
end
`;
};

const update_single = ({ genName }: StringOnlyMap) => {
  validate({ genName }, "update_single");
  return `
def update_${genName}(attrs) when is_map(attrs) do
  changeset =
    MapUtil.get(attrs, :id)
    |> get_${genName}!()
    |> change_${genName}(attrs)

  if changeset.valid?, do: Repo.update(changeset)
end
`;
};

const update_apis: ImmAPI[] = [
  {
    id: "update_many",
    fn: update_many,
    header: (dict: StringOnlyMap) => compute_header(dict, update_many),
  },
  {
    id: "update_single",
    fn: update_single,
    header: (dict: StringOnlyMap) => compute_header(dict, update_single),
  },
];

const comment_map: ApiIdMap = {
  update_many: comment_many,
  update_single: comment_single,
};

const definition_map: ApiIdMap = {
  update_many: update_many,
  update_single: update_single,
};

const gen_update_apis: ApiGenFunction = (apis, dict) => {
  const computed_apis = update_apis
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
      (api) => !computed_apis.map(({ header }) => header).includes(api),
    ),
  };
};

export { gen_update_apis };
