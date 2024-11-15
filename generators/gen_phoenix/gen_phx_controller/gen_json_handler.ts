import { join } from "path";
import { ImmutableGenerator, GenTypes } from "../../gen_controller";
import { generateFile } from "../../index";

const gen_json_handler = async (
  generator: ImmutableGenerator,
  typeDict: GenTypes
) => {
  const { WebDir, AppNameCamel, AppNameSnake, camelName, pluralName, name } =
    generator;
  const {
    generate: { http_controller },
  } = generator;
  const { ImmutableGlobal, Schema } = typeDict;
  const jsonHandlerPath = join(
    WebDir || ".",
    `lib/${AppNameSnake}_web/controllers`
  );

  const typeSource = (ImmutableGlobal || Schema)?.ex;

  const renderKeys = Object.keys(typeSource || {})
    .map((key) => `${key}: Map.get(${name}, :${key})`)
    .join(",\n      ");

  const content = `
defmodule ${AppNameCamel}Web.${camelName}JSON do
  alias ${AppNameCamel}Web.FallbackController

  @doc """
  Renders a ${name} or list of ${pluralName}.

  ## Examples
      iex> render(conn, :show, ${pluralName}: ${pluralName})
      {:ok, %{data: [%${camelName}{}]}

      iex> render(conn, :show, ${name}: ${name})
      {:ok, %{data: %${camelName}{}}}
  """
  def show(%{${pluralName}: ${pluralName}, query_data: q}) when is_list(${pluralName}) do
    if(q != %{},
      do: %{query: q},
      else: %{}
    )
    |> Map.merge(%{data: transform(${pluralName}), count: length(${pluralName})})
  end

  def show(%{${name}: ${name}, query_data: q}) do
    if(q != %{},
      do: %{query: q},
      else: %{}
    )
    |> Map.put(:data, transform(${name}))
  end

  def show(%{count: c}), do: %{success_count: c, fail_count: 0}

  def show(params), do: Map.merge(%{query_data: %{}}, params) |> show

  @doc """
  Renders ${pluralName} from batch operations

  ## Examples
      iex> render(conn, :show_partial, succeeded: ${name}_maps, failed: ${name}_changesets)
      {:partial_success, [%${camelName}{}], [%Changeset{}]}
  """
  def show_partial(params \\\\ %{query_data: %{}, succeeded: [], failed: []})

  def show_partial(%{succeeded: succeeded_${pluralName}, failed: failed_changesets, query_data: q})
      when is_list(succeeded_${pluralName}) and is_list(failed_changesets) do
    if(q != %{},
      do: %{query: q},
      else: %{}
    )
    |> Map.merge(%{
      success_count: length(succeeded_${pluralName}),
      fail_count: length(failed_changesets),
      data: transform(succeeded_${pluralName}),
      failed: FallbackController.error_transform(failed_changesets)
    })
  end

  def show_partial(%{success_count: s_count, fail_count: f_count}), do: %{success_count: s_count, failed_count: f_count}

  defp transform(${pluralName}) when is_list(${pluralName}), do: Enum.map(${pluralName}, &transform/1)

  defp transform(${name}) when is_map(${name}) do
    %{
      id: Map.get(${name}, :id),
      ${renderKeys}
    }
  end
end
`;

  return http_controller
    ? generateFile({
        dir: jsonHandlerPath,
        filename: `${name}_json.ex`,
        content,
      })
    : null;
};

export { gen_json_handler };
