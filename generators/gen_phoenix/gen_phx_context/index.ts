import { join } from "path";
import {
  ImmutableGenerator,
  ImmutableContext,
} from "../../gen_controller";
import { generateFile } from "../..";
import { StringOnlyMap } from "../../../utils/map";
import { gen_create_apis } from "./create";
import { gen_delete_apis } from "./delete";
import { gen_get_apis } from "./get";
import { gen_list_apis } from "./list";
import { gen_update_apis } from "./update";
import { api as custom_api } from "./custom";
import { log } from "../../../utils/logger";

const gen_apis = (requested_apis: string[], gen_ref_data: StringOnlyMap) => {
  log({ level: 5 }, "Requested Apis: ", requested_apis);
  const gen_apis: ApiGenFunction[] = [
    gen_create_apis,
    gen_delete_apis,
    gen_get_apis,
    gen_list_apis,
    gen_update_apis,
  ];
  const { computed, remaining_apis } = gen_apis.reduce(
    (acc, apiFn) => {
        log({level: 8}, "APIFN REDUCER", acc, apiFn)
        const { computed, remaining_apis } = acc;
        log({level: 8}, "APIFN COM", computed)
        log({level: 8}, "APIFN REM", remaining_apis)
        log({level: 8}, "APIFN RES", apiFn(
            remaining_apis,
            gen_ref_data
          )) 
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
    .map((api) => custom_api.fn({ header: api }))
    .join("\n");
  return computed + "\n" + custom_apis;
};

const gen_phx_contex = async (
  generator: ImmutableGenerator,
  _typeDict: any
) => {
  const {
    AppNameCamel,
    LibDir,
    generate,
    name: genName,
    camelName: genCamelName,
    pluralName: genPluralName,
  } = generator;
  const { name: camelName, apiFunctions } = generate.context as ImmutableContext;
  const contextPath = join(LibDir || "", `/lib/`);
  const snakeController = camelName
    .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1_$2")
    .replace(/^_/, "")
    .toLowerCase();

  const dict: StringOnlyMap = {
    camelName: camelName || "",
    genName,
    context: camelName,
    pluralName: genPluralName || "",
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
  change_${genName}(${genPluralName}) when is_list ${genPluralName} -> Returns a list of \`%Ecto.Changeset{}\` for tracking ${genName} changes

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

  def change_${genName}(${genPluralName}) when is_list(${genPluralName}),
    do:
      Enum.map(${genPluralName}, fn
        {${genName}, attr} -> change_${genName}(${genName}, attr)
        attr when is_map(attr) -> change_${genName}(attr)
      end)

  def change_${genName}(%${genCamelName}{} = ${genName}, attrs), do: ${genCamelName}.changeset(${genName}, attrs)
end
`;

  return generateFile({
    dir: contextPath,
    filename: `${snakeController}.ex`,
    content,
  });
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
export { gen_phx_contex };
