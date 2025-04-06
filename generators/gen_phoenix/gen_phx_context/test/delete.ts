import { StringOnlyMap, validate } from "../../../../utils/map";
import { compute_header } from "../../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const delete_many_test = ({
  camelName,
  genLowerSnakePlural,
  genLowerSnake,
}: StringOnlyMap) => {
  validate(
    { camelName, genLowerSnakePlural, genLowerSnake },
    "delete_many_test"
  );
  return `
  test "delete_${genLowerSnake}/1 deletes multiple ${genLowerSnakePlural}" do
    {:ok, ${genLowerSnakePlural}, []} = ${camelName}.create_${genLowerSnake}([@valid_attrs, @valid_attrs])
    operation = ${camelName}.delete_${genLowerSnake}(${genLowerSnakePlural})
    assert {:ok, 2, 0} = operation
  end
`;
};

const delete_single_test = ({ camelName, genLowerSnake }: StringOnlyMap) => {
  validate({ camelName, genLowerSnake }, "delete_single_test");
  return `
  test "delete_${genLowerSnake}/1 deletes a single ${genLowerSnake}" do
    {:ok, ${genLowerSnake}} = ${camelName}.create_${genLowerSnake}(@valid_attrs)
    ${camelName}.delete_${genLowerSnake}(${genLowerSnake})

    assert_raise Ecto.NoResultsError, fn ->
      ${camelName}.get_${genLowerSnake}!(${genLowerSnake}.id)
    end
  end
`;
};

const delete_single_by_id_test = ({
  camelName,
  genLowerSnake,
}: StringOnlyMap) => {
  validate({ camelName, genLowerSnake }, "delete_single_by_id_test");
  return `
  test "delete_${genLowerSnake}/1 deletes a single ${genLowerSnake} by id" do
    {:ok, ${genLowerSnake}} = ${camelName}.create_${genLowerSnake}(@valid_id)
    ${camelName}.delete_${genLowerSnake}(${genLowerSnake})

    assert_raise Ecto.NoResultsError, fn ->
      ${camelName}.get_${genLowerSnake}!(${genLowerSnake}.id)
    end
  end
    `;
};

const delete_api_tests: ImmAPI[] = [
  {
    id: "delete_many_test",
    fn: delete_many_test,
    header: (dict: StringOnlyMap) => compute_header(dict, delete_many_test),
  },
  {
    id: "delete_single_test",
    fn: delete_single_test,
    header: ({ genLowerSnake, genLowerSnakePlural }: StringOnlyMap) =>
      `delete_${genLowerSnake}(${genLowerSnakePlural}) when is_list(${genLowerSnakePlural})`,
  },
  {
    id: "delete_single_by_id_test",
    fn: delete_single_by_id_test,
    header: ({ genLowerSnake }: StringOnlyMap) =>
      `delete_${genLowerSnake}(${genLowerSnake}_params) when is_map(${genLowerSnake}_params)`,
  },
];

const definition_map: ApiIdMap = {
  delete_many_test: delete_many_test,
  delete_single_test: delete_single_test,
  delete_single_by_id_test: delete_single_by_id_test,
};

const gen_delete_api_tests: ApiGenFunction = (apis, dict) => {
  const computed_apis = delete_api_tests
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

export { gen_delete_api_tests };
