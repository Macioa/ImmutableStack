import { join } from "path";
import { generateFile } from "../../index";

const gen_dynamic_query_util = async (AppNameCamel: string, AppDir: string) => {
  const utilsPath = join(AppDir || "", "/lib/utils");

  const content = `
defmodule ${AppNameCamel}.Utils.DynamicQuery do
  import Ecto.Query
  @moduledoc """
  A utility module for building dynamic queries based on controller level restful query params.
  Pass the params and schema to by_schema to convert the restful query to a database query.
  """

  @doc """
  Given a map of controller level restful query params and a schema module,
      cast controller parameters to schema types for dynamic Ecto query construction.
  """
  def by_schema(controller_params, schema_module) do
    field_types = get_schema_field_types(schema_module)

    case validate_params(controller_params, field_types) do
      {:ok, parsed_params} ->
        query = Enum.reduce(parsed_params, from(s in schema_module), &apply_filter/2)

        opts =
          Enum.reduce(parsed_params, %{}, fn {key, op, value}, acc ->
            Map.put(acc, key, "#{op} #{value}")
          end)

        {:ok, query, opts}

      error_forward ->
        error_forward
    end
  end

  @doc """
  Given a schema module, return a map of field names to their types.
  """
  def get_schema_field_types(schema_module) when is_atom(schema_module) do
    schema_module.__schema__(:fields)
    |> Enum.map(fn field ->
      {field, schema_module.__schema__(:type, field)}
    end)
    |> Enum.into(%{})
  end

  @doc """
  Given controller level params and designated field types, validate the mathmatical operator and return a list of parsed params.
  """
  def validate_params(params, field_types) do
    Enum.reduce_while(params, {:ok, []}, fn {key, value}, {:ok, acc} ->
      case parse_param(key, value, field_types) do
        {:ok, parsed_param} -> {:cont, {:ok, [parsed_param | acc]}}
        {:error, message} -> {:halt, {:error, message}}
      end
    end)
  end

  @doc """
  Build query with parsed params.
  """
  def apply_filter({field, operator, value}, query) do
    field_atom = String.to_atom(field)

    dynamic_clause =
      case operator do
        "<" -> dynamic([u], field(u, ^field_atom) < ^value)
        ">" -> dynamic([u], field(u, ^field_atom) > ^value)
        "<=" -> dynamic([u], field(u, ^field_atom) <= ^value)
        ">=" -> dynamic([u], field(u, ^field_atom) >= ^value)
        "=" -> dynamic([u], field(u, ^field_atom) == ^value)
        _ -> raise "Invalid operator: #{operator}"
      end

    where(query, ^dynamic_clause)
  end

  # Check type of each param and build where clauses
  defp parse_param(key, value, field_types) do
    reg =
      ~r/(?<key>[_a-zA-z0-9]+)(?<operator>[ =<>])(?<value>.*)/
      |> Regex.named_captures(key)

    case reg do
      nil ->
        {:ok, {key, "=", value}}

      %{"key" => k, "operator" => o, "value" => v} ->
        validate_param_type(k, o, v, field_types)
    end
  end

  # Validate type based on the schema's field types
  defp validate_param_type(key, operator, value, field_types) do
    expected_type = Map.get(field_types, String.to_atom(key))

    case {expected_type, parse_value(value, expected_type)} do
      {nil, _} -> {:error, "Unknown field #{key}"}
      {_, :error} -> {:error, "Invalid value for #{key}. Expected a #{expected_type}."}
      {_, parsed_value} -> {:ok, {key, operator, parsed_value}}
    end
  end

  # Parse the value based on expected type
  defp parse_value(value, :integer) do
    case Integer.parse(value) do
      {v, ""} -> v
      _ -> :error
    end
  end

  defp parse_value(value, :string), do: value
end

defmodule ${AppNameCamel}.Plugs.ListAsJSON do
  @moduledoc """
  A plug for controllers that allows lists to be sent as top-level JSON arrays
  without needing to wrap them in an object. It detects the "_json" param and
  elevates it to the top level.
  """

  def init(options), do: options

  def call(%Plug.Conn{params: %{"_json" => json_data}} = conn, _opts) do
    %{conn | params: json_data}
  end

  def call(conn, _opts), do: conn
end
`;

  return generateFile(
    {
      dir: utilsPath,
      filename: "dynamic_query.ex",
      content,
    },
    "gen_dynamic_query_util",
  );
};

export { gen_dynamic_query_util };
