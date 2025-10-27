import path from "path";
import { readFile, writeFile } from "fs/promises";
import { AppData } from "@/readers/get_app_data";
import { log } from "@/utils/logger";

const inject_ui_to_custom_formatter = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, LibDir } = appdata;
  const file = path.join(LibDir, "lib/mix/tasks/custom_formatter.ex");
  
  log(
    { level: 2, color: "BLUE" },
    `\nUpdating custom formatter to handle multiple UIs including ${AppNameSnake}_${uiName}...`
  );

  try {
    const existingContent = await readFile(file, 'utf-8');
    
    // Extract existing UI names from the current formatter
    const regex = new RegExp(`apps/${AppNameSnake}_(\\w+)`, 'g');
    const uiNameMatches = existingContent.match(regex);
    const existingUIs = uiNameMatches ? 
      uiNameMatches.map(match => match.replace(`apps/${AppNameSnake}_`, '')) : 
      ['ui']; // fallback to 'ui' if no matches found
    
    // Add the new UI if it's not already there
    const allUIs = [...new Set([...existingUIs, uiName])];
    
    // Create the new formatter content that handles all UIs
    const newContent = `defmodule Mix.Tasks.CustomFormatter do
  use Mix.Task

  def run(args \\\\ []) do
    IO.puts("Immutable Formatter")

    {js_paths, ex_paths} =
      Enum.split_with(args, fn path ->
        ${allUIs.map(ui => `String.contains?(path, "apps/${AppNameSnake}_${ui}")`).join(' || ')} || String.ends_with?(path, ".ts") ||
          String.ends_with?(path, ".tsx")
      end)

    js_paths = Enum.map(js_paths, &String.replace(&1, ~r/(.*){0,1}apps\\/${AppNameSnake}_(${allUIs.join('|')})\\//, ""))

    IO.puts("Formatting Elixir files...")
    Mix.Task.run("format", ex_paths)

    IO.puts("Formatting TS files...")
    format_react_files(js_paths)

    IO.puts("Complete.")
  end

  defp format_react_files(_paths) do
    ui_names = [${allUIs.map(ui => `"${AppNameSnake}_${ui}"`).join(', ')}]
    
    Enum.each(ui_names, fn ui_name ->
      case System.cmd("npm", ["run", "format", "--prefix", ui_name], cd: "./apps") do
        {result, 0} ->
          IO.puts("Formatted #{ui_name}: #{result}")

        {result, exit_code} ->
          IO.puts(:stderr, "Format command failed for #{ui_name} with exit code #{exit_code}:")
          IO.puts(:stderr, result)
      end
    end)
  end
end`;

    await writeFile(file, newContent);
    
    return {
      type: "file_updated",
      path: file,
      content: `Updated custom formatter to handle UIs: ${allUIs.join(', ')}`
    };
  } catch (error) {
    log(
      { level: 2, color: "YELLOW" },
      `\nError updating custom formatter: ${error}`
    );
    throw error;
  }
};

export { inject_ui_to_custom_formatter };
