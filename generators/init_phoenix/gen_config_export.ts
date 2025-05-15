import { join } from "../../utils/path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_config_export = async ({
  AppNameCamel,
  AppNameSnake,
  LibDir,
}: AppData) => {
  const compilerPath = join(LibDir, `/lib/mix/tasks`);

  const content = `defmodule ${AppNameCamel}.Tasks.ExportConfig do
  # Values in these config groups will be passed to React as environment variables
  @configs [:ui]


  def generate_env_file(env_path) do
    env_path = env_path |> Path.join(".env")
    env_path |> Path.dirname() |> File.mkdir_p!()

    configs = @configs |> Enum.map(fn c ->
        (Application.get_env(:${AppNameSnake}, c) || [])
        |> Enum.map(fn {k, v} -> {c, k, v} end)
    end)
    |> List.flatten()

    env_content =
      configs
      |> Enum.map(fn {group, key, value} ->
        name_key = [group, key] |> Enum.map(fn s -> to_string(s) |> String.upcase() end) |> Enum.join("_")
        env_key = ("VITE_" <> name_key)
        env_value = encode_value(value)
        "#{env_key}=#{env_value}"
      end)
      |> Enum.join("\n")

    File.write!(env_path, env_content <> "\\n")
  end

  defp encode_value(value) when is_binary(value), do: value
  defp encode_value(value) when is_atom(value), do: Atom.to_string(value)
  defp encode_value(value) when is_map(value), do: Jason.encode!(value)
  defp encode_value(value), do: to_string(value)
end`;

  return generateFile(
    {
      dir: compilerPath,
      filename: "export_config.ex",
      content,
    },
    "gen_config_export"
  );
};

export { gen_config_export };
