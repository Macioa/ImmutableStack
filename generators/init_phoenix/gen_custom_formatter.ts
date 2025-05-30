import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_custom_formatter = async ({ AppNameSnake, LibDir }: AppData) => {
  const formatterPath = join(LibDir, `/lib/mix/tasks/`);

  const content = `
defmodule Mix.Tasks.CustomFormatter do
  use Mix.Task

  def run(args \\\\ []) do
    IO.puts("Immutable Formatter")

    {js_paths, ex_paths} =
      Enum.split_with(args, fn path ->
        String.contains?(path, "apps/${AppNameSnake}_ui") || String.ends_with?(path, ".ts") ||
          String.ends_with?(path, ".tsx")
      end)

    js_paths = Enum.map(js_paths, &String.replace(&1, ~r/(.*){0,1}apps\\/${AppNameSnake}_ui\\//, ""))

    IO.puts("Formatting Elixir files...")
    Mix.Task.run("format", ex_paths)

    IO.puts("Formatting TS files...")
    format_react_files(js_paths)

    IO.puts("Complete.")
  end

  defp format_react_files(paths) do
    js_paths = Enum.join(paths, " ")

    {_result, 0} =
      System.cmd("bash", ["-c", "npm run format #{js_paths}"], cd: "./apps/${AppNameSnake}_ui")

    # IO.puts(result)
  end
end
`;

  return generateFile(
    {
      dir: formatterPath,
      filename: "custom_formatter.ex",
      content,
    },
    "gen_custom_formatter"
  );
};

export { gen_custom_formatter };
