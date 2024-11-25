import { join } from "path";
import { generateFile } from "../index";

const gen_custom_compiler = async (
  AppName: string,
  LibDir: string
) => {
  const compilerPath = join(LibDir, `/lib/mix/tasks`);

  const content = `
defmodule Mix.Tasks.Compile.ImmutableCompiler do
  use Mix.Task.Compiler

  @impl Mix.Task.Compiler
  def run(_args) do
    case System.cmd("npm", ["run", "build", "--emptyOutDir"], stderr_to_stdout: true, cd: "apps/${AppName}_ui") do
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

  return generateFile({
    dir: compilerPath,
    filename: "immutable_compiler.ex",
    content,
  });
};

export { gen_custom_compiler };
