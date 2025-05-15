import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_custom_compiler = async ({
  AppNameSnake,
  AppNameCamel,
  LibDir,
}: AppData) => {
  const compilerPath = join(LibDir, `/lib/mix/tasks`);

  const content = `
defmodule Mix.Tasks.Compile.CustomCompiler do
  use Mix.Task.Compiler

  @impl Mix.Task.Compiler
  def run(_args) do
    %{${AppNameSnake}: app_path} = Mix.Project.deps_paths()

    ui_path =
      Path.join([app_path, "./..", "${AppNameSnake}_ui"])
      |> Path.expand()

    ${AppNameCamel}.Tasks.ExportConfig.generate_env_file(ui_path)

    case System.cmd("npm", ["run", "build", "--emptyOutDir"], stderr_to_stdout: true, cd: ui_path) do
      {output, 0} ->
        IO.puts(output)
        {:ok, []}
      {output, _exit_code} ->
        IO.puts(:stderr, output)
        {:error, []}
    end
  end

  @impl Mix.Task.Compiler
  def manifests, do: []
end
`;

  return generateFile(
    {
      dir: compilerPath,
      filename: "custom_compiler.ex",
      content,
    },
    "gen_custom_compiler"
  );
};

export { gen_custom_compiler };
