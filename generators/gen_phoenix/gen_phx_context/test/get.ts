import { StringOnlyMap, validate } from "../../../../utils/map";
import { compute_header } from "../../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const get_many_test = ({
  genLowerSnake,
  camelName,
  genLowerSnakePlural,
  genUpperCamel,
}: StringOnlyMap) => {
  validate(
    { genLowerSnake, camelName, genLowerSnakePlural, genUpperCamel },
    "get_many_test"
  );
  return `
  test "get_${genLowerSnake}!/1 returns the ${genLowerSnakePlural} with given ${genLowerSnakePlural}" do
    {:ok, ${genLowerSnakePlural}, []} = ${camelName}.create_${genLowerSnake}([@valid_attrs, @valid_attrs])
    valid_operation = ${camelName}.get_${genLowerSnake}!(${genLowerSnakePlural})
    assert [%${genUpperCamel}{}, %${genUpperCamel}{}] = valid_operation
    retreived = ${camelName}.get_${genLowerSnake}!(${genLowerSnakePlural} ++ [@fake_attrs])
    # should have one less ${genLowerSnake} than number of ids, since one id does not exist
    assert [%${genUpperCamel}{}, %${genUpperCamel}{}] = retreived
  end

  test "get_${genLowerSnake}!/1 returns the ${genLowerSnakePlural} with given ids" do
    {:ok, ${genLowerSnakePlural}, []} = ${camelName}.create_${genLowerSnake}([@valid_attrs, @valid_attrs])
    ${genLowerSnakePlural} = ${genLowerSnakePlural} |> Enum.map(&Map.get(&1, :id))
    valid_operation = ${camelName}.get_${genLowerSnake}!(${genLowerSnakePlural})
    assert [%${genUpperCamel}{}, %${genUpperCamel}{}] = valid_operation
    retreived = ${camelName}.get_${genLowerSnake}!(${genLowerSnakePlural} ++ [@fake_id])
    # should have one less ${genLowerSnake} than number of ids, since one id does not exist
    assert [%${genUpperCamel}{}, %${genUpperCamel}{}] = retreived
  end
`;
};

const get_single_test = ({
  genLowerSnake,
  camelName,
  genUpperCamel,
}: StringOnlyMap) => {
  validate({ genLowerSnake, camelName, genUpperCamel }, "get_single_test");
  return `
  test "get_${genLowerSnake}!/1 returns the ${genLowerSnake} with given ${genLowerSnake}" do
    {:ok, ${genLowerSnake}} = ${camelName}.create_${genLowerSnake}(@valid_attrs)
    valid_operation = ${camelName}.get_${genLowerSnake}!(${genLowerSnake})
    assert %${genUpperCamel}{} = valid_operation

    assert_raise Ecto.NoResultsError, fn ->
      ${camelName}.get_${genLowerSnake}!(@fake_attrs)
    end
  end
    `;
};

const get_single_by_id_test = ({
  genLowerSnake,
  camelName,
  genUpperCamel,
}: StringOnlyMap) => {
  validate(
    { genLowerSnake, camelName, genUpperCamel },
    "get_single_by_id_test"
  );
  return `
  test "get_${genLowerSnake}!/1 returns the ${genLowerSnake} with given id" do
    {:ok, ${genLowerSnake}} = ${camelName}.create_${genLowerSnake}(@valid_attrs)
    valid_operation = ${camelName}.get_${genLowerSnake}!(${genLowerSnake}.id)
    assert %${genUpperCamel}{} = valid_operation

    assert_raise Ecto.NoResultsError, fn ->
      ${camelName}.get_${genLowerSnake}!(@fake_id)
    end
  end  
`;
};

const get_apis_test: ImmAPI[] = [
  {
    id: "get_many_test",
    fn: get_many_test,
    header: ({ genLowerSnake, genLowerSnakePlural }: StringOnlyMap) =>
      `get_${genLowerSnake}!(${genLowerSnakePlural}) when is_list(${genLowerSnakePlural})`,
  },
  {
    id: "get_single_test",
    fn: get_single_test,
    header: ({ genLowerSnake }: StringOnlyMap) =>
      `get_${genLowerSnake}!(${genLowerSnake}_params) when is_map(${genLowerSnake}_params)`,
  },
  {
    id: "get_single_by_id_test",
    fn: get_single_by_id_test,
    header: ({ genLowerSnake }: StringOnlyMap) =>
      `get_${genLowerSnake}!(id) when is_binary(id)`,
  },
];

const definition_map: ApiIdMap = {
  get_many_test: get_many_test,
  get_single_test: get_single_test,
  get_single_by_id_test: get_single_by_id_test,
};

const gen_get_api_tests: ApiGenFunction = (apis, dict) => {
  const computed_apis = get_apis_test
    .map(({ id, fn, header }) => ({ id, def: fn(dict), header: header(dict) }))
    .filter(({ header }) => apis.includes(header));
  const requested_ids = computed_apis.map(({ id }) => id || "");
  const definitions = requested_ids
    .map((id) => definition_map[id](dict))
    .join("\n");

  return {
    result: definitions,
    remaining_apis: apis.filter(
      (api) => !computed_apis.map(({ header }) => header).includes(api)
    ),
  };
};

export { gen_get_api_tests };
