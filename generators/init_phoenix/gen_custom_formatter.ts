import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";
import { elixirRunCmd } from "./elixir_os_helpers";

const gen_custom_formatter = async ({ AppNameSnake, LibDir }: AppData, uiName: string = 'ui') => {
  const formatterPath = join(LibDir, `/lib/mix/tasks/`);

  const content = `
defmodule Mix.Tasks.CustomFormatter do
  use Mix.Task

  def run(args \\\\ []) do
    IO.puts("Immutable Formatter")

    {js_paths, ex_paths} =
      Enum.split_with(args, fn path ->
        String.contains?(path, "apps/${AppNameSnake}_${uiName}") || String.ends_with?(path, ".ts") ||
          String.ends_with?(path, ".tsx")
      end)

    js_paths = Enum.map(js_paths, &String.replace(&1, ~r/(.*){0,1}apps\\/${AppNameSnake}_${uiName}\\//, ""))

    IO.puts("Formatting Elixir files...")
    Mix.Task.run("format", ex_paths)

    IO.puts("Formatting TS files...")
    format_react_files(js_paths)

    IO.puts("Complete.")
  end

  defp format_react_files(_paths) do
    format_dirs = ["${AppNameSnake}_${uiName}", "${AppNameSnake}/lib/typescript"] |> Enum.uniq()
    
    Enum.each(format_dirs, fn dir ->
      # Use pnpm run format for UI dirs with package.json, oxfmt directly for the typescript symlink
      format_cmd = if dir == "${AppNameSnake}/lib/typescript" do
        ["exec", "oxfmt", dir]
      else
        ["--dir", dir, "run", "format"]
      end
      
      case run_cmd("pnpm", format_cmd, cd: "./apps") do
        {result, 0} ->
          IO.puts("Formatted #{dir}: #{result}")

        {result, exit_code} ->
          IO.puts(:stderr, "Format command failed for #{dir} with exit code #{exit_code}:")
          IO.puts(:stderr, result)
      end
    end)
  end

${elixirRunCmd}
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
