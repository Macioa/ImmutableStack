import { StringOnlyMap, validate } from "../../../../utils/map";
import { compute_header } from "../../../../utils/gen_header";
import { ImmAPI, ApiIdMap, ApiGenFunction } from ".";

const list_standard_test = ({
  genLowerSnakePlural,
  camelName,
  genUpperCamel,
}: StringOnlyMap) => {
  validate(
    { genLowerSnakePlural, camelName, genUpperCamel },
    "list_standard_test"
  );
  return `
  test "list_${genLowerSnakePlural}/0 returns all ${genLowerSnakePlural}" do
    {:ok, _${genLowerSnakePlural}} = ${camelName}.create_${genLowerSnakePlural}(@valid_attrs)
    operation = ${camelName}.list_${genLowerSnakePlural}()

    assert {:ok, [%${genUpperCamel}{}],
            %{page_size: 100, page_number: 1, total_entries: 1, total_pages: 1}} = operation
  end
    `;
};

const list_dynamic_test = ({
  genLowerSnakePlural,
  camelName,
  genUpperCamel,
}: StringOnlyMap) => {
  validate(
    { genLowerSnakePlural, camelName, genUpperCamel },
    "list_dynamic_test"
  );
  return `
  test "list_${genLowerSnakePlural}_by/2 returns all ${genLowerSnakePlural} by field" do
    {:ok, _${genLowerSnakePlural}} = ${camelName}.create_${genLowerSnakePlural}(@valid_attrs)
    operation = ${camelName}.list_${genLowerSnakePlural}_by(%{"example1" => "1"}, %{})

    assert {:ok, [%${genUpperCamel}{}],
            %{
              "example1" => "= 1",
              page: %{page_size: 100, page_number: 1, total_entries: 1, total_pages: 1}
            }} = operation
  end

  test "list_${genLowerSnakePlural}_by/2 returns all ${genLowerSnakePlural} by field with pagination" do
    {:ok, _${genLowerSnakePlural}, []} = ${camelName}.create_${genLowerSnakePlural}([@valid_attrs, @valid_attrs, @valid_attrs])
    operation = ${camelName}.list_${genLowerSnakePlural}_by(%{"example1" => "1"}, %{page_size: 2})
    {:ok, ${genLowerSnakePlural}, page} = operation
    assert [%${genUpperCamel}{}, %${genUpperCamel}{}] = ${genLowerSnakePlural}

    assert %{
             :page => %{page_size: 2, page_number: 1, total_entries: 3, total_pages: 2},
             "example1" => "= 1"
           } = page
  end
`;
};

const list_api_tests: ImmAPI[] = [
  {
    id: "list_standard_test",
    fn: list_standard_test,
    header: ({ genLowerSnakePlural }: StringOnlyMap) =>
      `list_${genLowerSnakePlural}(page_query \\\\ %{})`,
  },
  {
    id: "list_dynamic_test",
    fn: list_dynamic_test,
    header: ({ genLowerSnakePlural }: StringOnlyMap) =>
      `list_${genLowerSnakePlural}_by(entity_queries, page_queries \\\\ %{})`,
  },
];

const definition_map: ApiIdMap = {
  list_standard_test: list_standard_test,
  list_dynamic_test: list_dynamic_test,
};

const gen_list_api_tests: ApiGenFunction = (apis, dict) => {
  const computed_apis = list_api_tests
    .map(({ id, fn, header }) => ({ id, def: fn(dict), header: header(dict) }))
    .filter(({ header }) => apis.includes(header));
  const requested_ids = computed_apis.map(({ id }) => id || "");
  return {
    result: requested_ids.map((id) => definition_map[id](dict)).join("\n"),
    remaining_apis: apis.filter(
      (api) => !computed_apis.map(({ header }) => header).includes(api)
    ),
  };
};

export { gen_list_api_tests };
