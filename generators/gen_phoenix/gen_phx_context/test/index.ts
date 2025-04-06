import { join } from "path";
import {
  ImmutableGenerator,
  ImmutableContext,
} from "../../../../immutable_gen";
import { generateFile } from "../../..";
import { StringOnlyMap } from "../../../../utils/map";
import { gen_create_api_tests } from "./create";
import { gen_get_api_tests } from "./get";
import { gen_delete_api_tests } from "./delete";
import { gen_list_api_tests } from "./list";
import { gen_update_api_tests } from "./update";
import { api_test as custom_api_test } from "./custom";
import { log } from "../../../../utils/logger";

const gen_api_tests = (
  requested_apis: string[],
  gen_ref_data: StringOnlyMap
) => {
  log({ level: 7 }, "Requested Apis: ", requested_apis);
  const gen_apis: ApiGenFunction[] = [
    gen_create_api_tests,
    gen_get_api_tests,
    gen_delete_api_tests,
    gen_list_api_tests,
    gen_update_api_tests,
  ];
  const { computed, remaining_apis } = gen_apis.reduce(
    (acc, apiFn) => {
      log({ level: 8 }, "APIFN REDUCER", acc, apiFn);
      const { computed, remaining_apis } = acc;
      log({ level: 8 }, "APIFN COM", computed);
      log({ level: 8 }, "APIFN REM", remaining_apis);
      log({ level: 1 }, "APIFN RES", apiFn(remaining_apis, gen_ref_data));
            const { result, remaining_apis: new_remaining } = apiFn(
        remaining_apis,
        gen_ref_data
      );
            return { computed: computed + result, remaining_apis: new_remaining };
    },
    { computed: "", remaining_apis: requested_apis }
  );
  log({ level: 7 }, "Computed Apis: ", computed);
  const custom_apis = remaining_apis
    .map((api) => custom_api_test.fn({ header: api }))
    .join("\n");
  return computed + "\n" + custom_apis;
};

const gen_phx_context_test = async (
  generator: ImmutableGenerator,
  _typeDict: any
) => {
  const { AppNameCamel, LibDir, generate, name } = generator;
  const {
    singleSnake: genName,
    singleUpperCamel: genCamelName,
    pluralUpperCamel: genPluralCamel,
    pluralSnake: genPluralSnake,
  } = name;
  const { name: camelName, apiFunctions } =
    generate.context as ImmutableContext;
  const contextTestPath = join(LibDir || "", `/test/`);
  const snakeController = camelName
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1_$2")
    .replace(/^_/, "")
    .toLowerCase();

  const dict: StringOnlyMap = {
    camelName,
    genLowerSnake: genName || "",
    genUpperCamel: genCamelName || "",
    genLowerSnakePlural: genPluralSnake || "",
  };

  const content = `
  defmodule ${AppNameCamel}.${camelName}Test do
  use ${AppNameCamel}.DataCase

  alias ${AppNameCamel}.${genCamelName}
  alias ${AppNameCamel}.${camelName}

  @valid_attrs %{example1: 1, example2: "1", example3: 1.0}
  @update_attrs %{example1: 2, example2: "2", example3: 2.0}
  @invalid_attrs %{example1: "1", example2: "1"}
  @fake_id "601d74e4-a8d3-4b6e-8365-eddb4c893327"
  @fake_attrs Map.put(@valid_attrs, :id, @fake_id)

${gen_api_tests(apiFunctions, dict)}

end
`;

  return generateFile(
    {
      dir: contextTestPath,
      filename: `${snakeController}_test.exs`,
      content,
    },
    "gen_phx_contex_test"
  );
};

interface ImmAPI {
  id?: string;
  fn: (args: StringOnlyMap) => string;
  header: (args: StringOnlyMap) => string;
}

interface ApiIdMap {
  [key: string]: (dict: StringOnlyMap) => string;
}

interface ApiGenFunction {
  (api_list: string[], dict: StringOnlyMap): {
    result: string;
    remaining_apis: string[];
  };
}
export type { ImmAPI, ApiIdMap, ApiGenFunction };
export { gen_phx_context_test };
