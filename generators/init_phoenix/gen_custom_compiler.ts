import { join } from "path";
import { generateFile } from "../index";

const gen_custom_compiler = async (
  AppNameCamel: string,
  AppNameSnake: string,
  LibDir: string
) => {
  const compilerPath = join(LibDir, `/lib/mix/tasks`);

  const content = `
defmodule Mix.Tasks.Compile.CustomCompiler do
  use Mix.Task.Compiler

  @impl Mix.Task.Compiler
  def run(_args) do
    ${AppNameCamel}.Tasks.ExportConfig.generate_env_file()
    case System.cmd("npm", ["run", "build", "--emptyOutDir"], stderr_to_stdout: true, cd: "apps/${AppNameSnake}_ui") do
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
