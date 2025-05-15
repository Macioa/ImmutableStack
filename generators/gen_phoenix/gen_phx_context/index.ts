import { generateFile } from "../..";
import { ImmutableContext, ImmutableGenerator } from "../../../immutable_gen";
import { CommentType, mark } from "../../../repair";
import { log } from "../../../utils/logger";
import { StringOnlyMap } from "../../../utils/map";
import { join } from "../../../utils/path";
import { gen_create_apis } from "./create";
import { api as custom_api } from "./custom";
import { gen_delete_apis } from "./delete";
import { gen_get_apis } from "./get";
import { gen_list_apis } from "./list";
import { gen_update_apis } from "./update";

const gen_apis = (requested_apis: string[], gen_ref_data: StringOnlyMap) => {
  log({ level: 7 }, "Requested Apis: ", requested_apis);
  const gen_apis: ApiGenFunction[] = [
    gen_create_apis,
    gen_delete_apis,
    gen_get_apis,
    gen_list_apis,
    gen_update_apis,
  ];
  const { computed, remaining_apis } = gen_apis.reduce(
    (acc, apiFn) => {
      log({ level: 8 }, "APIFN REDUCER", acc, apiFn);
      const { computed, remaining_apis } = acc;
      log({ level: 8 }, "APIFN COM", computed);
      log({ level: 8 }, "APIFN REM", remaining_apis);
      log({ level: 8 }, "APIFN RES", apiFn(remaining_apis, gen_ref_data));
      const { result, remaining_apis: new_remaining } = apiFn(
        remaining_apis,
        gen_ref_data
      );

      return {
        computed:
          computed +
          mark(
            { str: result, entity: gen_ref_data.genCamelName, type: "CONTEXT" },
            "EX" as CommentType
          ),
        remaining_apis: new_remaining,
      };
    },
    { computed: "", remaining_apis: requested_apis }
  );
  log({ level: 7 }, "Computed Apis: ", computed);
  const custom_apis = remaining_apis
    .map((api) => custom_api.fn({ header: api }))
    .map((api) =>
      mark(
        { str: api, entity: gen_ref_data.genCamelName, type: "CONTEXT" },
        "EX" as CommentType
      )
    )
    .join("\n");
  return computed + "\n" + custom_apis;
};

const gen_phx_context = async (
  generator: ImmutableGenerator,
  _typeDict: any
) => {
  const {
    AppData: { AppNameCamel, LibDir },
    generate,
    name,
  } = generator;
  const {
    singleSnake: genName,
    singleUpperCamel: genCamelName,
    pluralUpperCamel: genPluralCamel,
    pluralSnake: genPluralSnake,
  } = name;
  const { name: camelName, apiFunctions } =
    generate.context as ImmutableContext;
  const contextPath = join(LibDir, `/lib/`);
  const snakeController = camelName
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1_$2")
    .replace(/^_/, "")
    .toLowerCase();

  const dict: StringOnlyMap = {
    camelName: camelName || "",
    genName,
    context: camelName || "",
    pluralNameSnake: genPluralSnake || "",
    pluralNameCamel: genPluralCamel || "",
    AppNameCamel: AppNameCamel || "",
    genCamelName: genCamelName || "",
  };

  const content = `
defmodule ${AppNameCamel}.${camelName} do
  @moduledoc """
  The ${camelName} context.
  """

  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias ${AppNameCamel}.Repo
  alias ${AppNameCamel}.Utils.DynamicQuery
  alias ${AppNameCamel}.Utils.Paginate
  alias ${AppNameCamel}.Utils.Chunk
  alias ${AppNameCamel}.Utils.MapUtil

  alias ${AppNameCamel}.${genCamelName}

  ${gen_apis(apiFunctions, dict)}

  @doc """
  change_${genName}(${genPluralSnake}) when is_list ${genPluralSnake} -> Returns a list of \`%Ecto.Changeset{}\` for tracking ${genName} changes

  ## Examples
      iex> change_${genName}([{${genName}1, attrs1}, {${genName}2, attrs2}])
      %Ecto.Changeset{data: [%${genCamelName}{}, %${genCamelName}{}]}

  change_${genName}(%${genCamelName}{} = ${genName}, attrs \\\\ %{}) -> Returns \`%Ecto.Changeset{}\` for tracking ${genName} changes.

  ## Examples
      iex> change_${genName}(${genName})
      %Ecto.Changeset{data: %${genCamelName}{}}

  """
  def change_${genName}(attrs \\\\ %{})
  def change_${genName}(attrs) when is_map(attrs), do: change_${genName}(%${genCamelName}{}, attrs)

  def change_${genName}(${genPluralSnake}) when is_list(${genPluralSnake}),
    do:
      Enum.map(${genPluralSnake}, fn
        {${genName}, attr} -> change_${genName}(${genName}, attr)
        attr when is_map(attr) -> change_${genName}(attr)
      end)

  def change_${genName}(%${genCamelName}{} = ${genName}, attrs), do: ${genCamelName}.changeset(${genName}, attrs)
end
`;

  return generateFile(
    {
      dir: contextPath,
      filename: `${snakeController}.ex`,
      content,
    },
    "gen_phx_context"
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
export { gen_phx_context };
export type { ApiGenFunction, ApiIdMap, ImmAPI };

