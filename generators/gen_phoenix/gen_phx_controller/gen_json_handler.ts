import { join } from "path";
import { ImmutableGenerator, GenTypes } from "../../../immutable_gen";
import { generateFile } from "../../index";
import { CommentType, mark } from "../../../repair";

const gen_json_handler = async (
  generator: ImmutableGenerator,
  typeDict: GenTypes
) => {
  const { WebDir, AppNameCamel, AppNameSnake, generate, name } = generator;
  const { http_controller } = generate;
  const { singleUpperCamel, pluralSnake, singleSnake } = name;
  const { ImmutableGlobal, Schema } = typeDict;
  const jsonHandlerPath = join(
    WebDir || ".",
    `lib/${AppNameSnake}_web/controllers`
  );

  const typeSource = (ImmutableGlobal || Schema)?.ex;

  const renderKeys = Object.keys(typeSource || {})
    .map((key) => `${key}: Map.get(${singleSnake}, :${key})`)
    .join(",\n      ");

  const contentInit = `
defmodule ${AppNameCamel}Web.${singleUpperCamel}JSON do
  alias ${AppNameCamel}Web.FallbackController

  @doc """
  Renders a ${singleSnake} or list of ${pluralSnake}.

  ## Examples
      iex> render(conn, :show, ${pluralSnake}: ${pluralSnake})
      {:ok, %{data: [%${singleUpperCamel}{}]}

      iex> render(conn, :show, ${singleSnake}: ${singleSnake})
      {:ok, %{data: %${singleUpperCamel}{}}}
  """
  def show(%{${pluralSnake}: ${pluralSnake}, query_data: q}) when is_list(${pluralSnake}) do
    if(q != %{},
      do: %{query: q},
      else: %{}
    )
    |> Map.merge(%{data: transform(${pluralSnake}), count: length(${pluralSnake})})
  end

  def show(%{${singleSnake}: ${singleSnake}, query_data: q}) do
    if(q != %{},
      do: %{query: q},
      else: %{}
    )
    |> Map.put(:data, transform(${singleSnake}))
  end

  def show(%{count: c}), do: %{success_count: c, fail_count: 0}

  def show(params), do: Map.merge(%{query_data: %{}}, params) |> show

  @doc """
  Renders ${pluralSnake} from batch operations

  ## Examples
      iex> render(conn, :show_partial, succeeded: ${singleSnake}_maps, failed: ${singleSnake}_changesets)
      {:partial_success, [%${singleUpperCamel}{}], [%Changeset{}]}
  """
  def show_partial(params \\\\ %{query_data: %{}, succeeded: [], failed: []})

  def show_partial(%{succeeded: succeeded_${pluralSnake}, failed: failed_changesets, query_data: q})
      when is_list(succeeded_${pluralSnake}) and is_list(failed_changesets) do
    if(q != %{},
      do: %{query: q},
      else: %{}
    )
    |> Map.merge(%{
      success_count: length(succeeded_${pluralSnake}),
      fail_count: length(failed_changesets),
      data: transform(succeeded_${pluralSnake}),
      failed: FallbackController.error_transform(failed_changesets)
    })
  end

  def show_partial(%{success_count: s_count, fail_count: f_count}), do: %{success_count: s_count, failed_count: f_count}

  defp transform(${pluralSnake}) when is_list(${pluralSnake}), do: Enum.map(${pluralSnake}, &transform/1)

  defp transform(${singleSnake}) when is_map(${singleSnake}) do
    %{
      id: Map.get(${singleSnake}, :id),
      ${renderKeys}
    }
  end
end
`;
  const content = mark(
    { str: contentInit, type: "JSON_HANDLER", entity: singleSnake },
    "EX" as CommentType
  );

  return http_controller
    ? generateFile(
        {
          dir: jsonHandlerPath,
          filename: `${singleSnake}_json.ex`,
          content,
        },
        "gen_json_handler"
      )
    : null;
};

export { gen_json_handler };
