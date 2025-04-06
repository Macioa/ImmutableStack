import { StringOnlyMap, validate } from "../../../../utils/map";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";
import { compute_header } from "../../../../utils/gen_header";
import { log } from "../../../../utils/logger";

const create_many_test = ({
  camelName,
  genLowerSnakePlural,
  genLowerSnake,
  genUpperCamel,
}: StringOnlyMap) => {
  validate(
    { camelName, genLowerSnakePlural, genLowerSnake, genUpperCamel },
    "create_many_test"
  );

  return `
  test "create_${genLowerSnake}/1 creates multiple ${genLowerSnakePlural}" do
    operation = ${camelName}.create_${genLowerSnake}([@valid_attrs, @valid_attrs])
    assert {:ok, [%${genUpperCamel}{}, %${genUpperCamel}{}], []} = operation
  end

  test "create_${genLowerSnake}/1 creates some ${genLowerSnakePlural} with partial success" do
    operation = ${camelName}.create_${genLowerSnake}([@valid_attrs, @invalid_attrs])
    assert {:partial_success, [%${genUpperCamel}{}], [%Ecto.Changeset{}]} = operation
  end
`;
};

const create_single_test = ({
  camelName,
  genLowerSnake,
  genUpperCamel,
}: StringOnlyMap) => {
  validate({ camelName, genLowerSnake, genUpperCamel }, "create_single_test");
  return `
 test "create_${genLowerSnake}/1 creates a single ${genLowerSnake}" do
    operation = ${camelName}.create_${genLowerSnake}(@valid_attrs)
    assert {:ok, %${genUpperCamel}{}} = operation
  end
`;
};

const create_api_tests: ImmAPI[] = [
  {
    id: "create_many_test",
    fn: create_many_test,
    header: ({genLowerSnake}: StringOnlyMap) => `create_${genLowerSnake}(attrs) when is_list(attrs)`,
  },
  {
    id: "create_single_test",
    fn: create_single_test,
    header: ({genLowerSnake}: StringOnlyMap) => `create_${genLowerSnake}(${genLowerSnake}_params) when is_map(${genLowerSnake}_params)`,
  },
];

const definition_map: ApiIdMap = {
  create_many_test,
  create_single_test,
};

const gen_create_api_tests: ApiGenFunction = (apis, dict) => {
  const computed_apis = create_api_tests.map(({ id, fn, header }) => ({
    id,
    def: fn(dict),
    header: header(dict),
  }));
  log({ level: 7 }, "Gen Create API tests", computed_apis);

  const filtered_apis = computed_apis.filter(({ header }) => {
        return apis.includes(header)
  }
  );

  const requested_ids = filtered_apis.map(({ id }) => id || "");
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

export { gen_create_api_tests };
