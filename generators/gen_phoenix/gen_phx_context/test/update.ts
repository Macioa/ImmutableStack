import { StringOnlyMap, validate } from "../../../../utils/map";
import { compute_header } from "../../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const update_many_test = ({
  genLowerSnakePlural,
  camelName,
  genUpperCamel,
}: StringOnlyMap) => {
  validate(
    { genLowerSnakePlural, camelName, genUpperCamel },
    "update_many_test"
  );
  return `
  test "update_${genLowerSnakePlural}/1 updates multiple ${genLowerSnakePlural}" do
    {:ok, ${genLowerSnakePlural}, []} = ${camelName}.create_${genLowerSnakePlural}([@valid_attrs, @valid_attrs])
    ${genLowerSnakePlural} = ${genLowerSnakePlural} |> Enum.map(&Map.merge(@update_attrs, %{id: &1.id}))
    operation = ${camelName}.update_${genLowerSnakePlural}(${genLowerSnakePlural})
    assert {:ok, [%${genUpperCamel}{}, %${genUpperCamel}{}], []} = operation
    partial_operation = ${camelName}.update_${genLowerSnakePlural}(${genLowerSnakePlural} ++ [@fake_attrs])
    assert {:partial_success, [%${genUpperCamel}{}, %${genUpperCamel}{}], [_failed_attrs]} = partial_operation
  end
`;
};

const update_single_test = ({
  genLowerSnakePlural,
  camelName,
}: StringOnlyMap) => {
  validate({ genLowerSnakePlural, camelName }, "update_single_test");
  return `
  test "update_${genLowerSnakePlural}/1 updates a single ${genLowerSnakePlural}" do
    {:ok, %{id: id}} = ${camelName}.create_${genLowerSnakePlural}(@valid_attrs)
    operation = ${camelName}.update_${genLowerSnakePlural}(Map.merge(@update_attrs, %{id: id}))
    assert {:ok, result_${genLowerSnakePlural}} = operation
    assert new_${genLowerSnakePlural} = ${camelName}.get_${genLowerSnakePlural}!(result_${genLowerSnakePlural})

    assert %{
             id: res_id,
             example1: example1,
             example2: example2,
             example3: example3,
             updated_at: _,
             inserted_at: _
           } = new_${genLowerSnakePlural}

    assert [example1, example2, example3, res_id] == [
             @update_attrs.example1,
             @update_attrs.example2,
             @update_attrs.example3,
             id
           ]
  end
`;
};

const update_api_tests: ImmAPI[] = [
  {
    id: "update_many_test",
    fn: update_many_test,
    header: ({ genLowerSnake, genLowerSnakePlural }: StringOnlyMap) =>
      `update_${genLowerSnake}(${genLowerSnakePlural}) when is_list(${genLowerSnakePlural})`,
  },
  {
    id: "update_single_test",
    fn: update_single_test,
    header: ({ genLowerSnake }: StringOnlyMap) =>
      `update_${genLowerSnake}(attrs) when is_map(attrs)`,
  },
];

const definition_map: ApiIdMap = {
  update_many_test: update_many_test,
  update_single_test: update_single_test,
};

const gen_update_api_tests: ApiGenFunction = (apis, dict) => {
  const computed_apis = update_api_tests
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

export { gen_update_api_tests };
