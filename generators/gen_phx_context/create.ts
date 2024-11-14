import { StringOnlyMap } from "../../utils/map";
import { ImmAPI, ApiIdMap, ApiGenFunction } from "./";
import { compute_header } from "../../utils/gen_header";
import { log } from "../../utils/logger";

const comment_main = ({ pluralName }: StringOnlyMap, examples: string) => {
  return `
  @doc """
    Create ${pluralName} by id.

    ## Examples
    ${examples}
    """
`;
};

const comment_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  return `
create_${genName}(attrs) when is_list attrs -> Creates ${pluralName} from an array of attrs.

  ## Examples
      iex> create_${genName}([%{field: value}, %{field: value}])
      {:ok, [%${genCamelName}{}, %${genCamelName}{}]}
`;
};

const comment_single = ({ genName, genCamelName }: StringOnlyMap) => {
  return `
 create_${genName}(attrs \\ %{}) -> Creates a ${genName}.

  ## Examples
      iex> create_${genName}(%{field: value})
      {:ok, %${genCamelName}{}}
      iex> create_${genName}(%{field: bad_value})
      {:error, %Ecto.Changeset{}}
`;
};

// const create_main = ({ genName }: StringOnlyMap) => {
//   return `def create_${genName}(${genName}_params) when is_map(${genName}_params) do`;
// };

const create_many = ({ genName, pluralName, genCamelName }: StringOnlyMap) => {
  return `
  def create_${genName}(attrs) when is_list(attrs) do
    attrs
    |> Chunk.apply(fn attr_chunk ->
      changesets = change_${genName}(attr_chunk)

      case Enum.split_with(changesets, & &1.valid?) do
        {valid, []} ->
          created = Chunk.prep(valid)
          {_, result} = Repo.insert_all(${genCamelName}, created, returning: true)
          {:ok, result, []}

        {[], invalid} ->
          {:error, [], invalid}

        {valid, invalid} ->
          created = Chunk.prep(valid)
          {_, result} = Repo.insert_all(${genCamelName}, created, returning: true)
          {:partial_success, result, invalid}
      end
    end)
    |> Chunk.flat_reduce()
  end
`;
};

const create_single = ({ genName }: StringOnlyMap) => {
  return `
  def create_${genName}(${genName}_params) when is_map(${genName}_params) do
    changeset = change_${genName}(${genName}_params)
    if changeset.valid?, do: Repo.insert(changeset), else: {:error, changeset}
  end
`;
};

const create_apis: ImmAPI[] = [
  {
    id: "create_many",
    fn: create_many,
    header: (dict: StringOnlyMap) => compute_header(dict, create_many),
  },
  {
    id: "create_single",
    fn: create_single,
    header: (dict: StringOnlyMap) => compute_header(dict, create_single),
  },
];

const comment_map: ApiIdMap = {
  create_many: comment_many,
  create_single: comment_single,
};

const definition_map: ApiIdMap = {
  create_many,
  create_single,
};

const gen_create_apis: ApiGenFunction = (apis, dict) => {
  const computed_apis = create_apis.map(({ id, fn, header }) => ({
    id,
    def: fn(dict),
    header: header(dict),
  }));
  log({ level: 2 }, "Gen Create APIS", computed_apis);
  const filtered_apis = computed_apis.filter(({ header }) =>
    apis.includes(header)
  );
  const requested_ids = filtered_apis.map(({ id }) => id || "");
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

export { gen_create_apis };
