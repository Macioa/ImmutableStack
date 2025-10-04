import { join } from "@/utils/path";
import { generateFile } from "@/generators/index";
import { AppData } from "@/readers/get_app_data";

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

    typescript_path =
      Path.join([app_path, "lib", "typescript"])
      |> Path.expand()

    ${AppNameCamel}.Tasks.ExportConfig.generate_env_file(ui_path)

    # Create symlink for TypeScript dependencies
    typescript_node_modules = Path.join(typescript_path, "node_modules")
    ui_node_modules = Path.join(ui_path, "node_modules")
    
    if File.exists?(typescript_path) and File.exists?(ui_node_modules) do
      # Remove existing symlink or directory if it exists
      if File.exists?(typescript_node_modules) do
        File.rm_rf(typescript_node_modules)
        IO.puts("Removed existing: #{typescript_node_modules}")
      end
      
      case File.ln_s(ui_node_modules, typescript_node_modules) do
        :ok ->
          IO.puts("Symlink created: #{typescript_node_modules} -> #{ui_node_modules}")
        {:error, reason} ->
          IO.puts(:stderr, "Failed to create symlink: #{reason}")
      end
    else
      IO.puts("Warning: TypeScript directory or UI node_modules not found, skipping symlink creation")
    end

    case System.cmd("npm", ["run", "build", "--emptyOutDir"], stderr_to_stdout: true, cd: ui_path) do
      {output, 0} ->
        IO.puts(output)
        {:ok, []}
      {output, _exit_code} ->
        IO.puts(:stderr, output)
        
        # Check for common dependency errors that require clean install
        if String.contains?(output, "@rollup/rollup-darwin-arm64") or 
           String.contains?(output, "Cannot find module") or
           String.contains?(output, "npm has a bug related to optional dependencies") do
          
          IO.puts("Detected dependency error, attempting clean install...")
          
          # Clean install
          case System.cmd("npm", ["ci"], stderr_to_stdout: true, cd: ui_path) do
            {install_output, 0} ->
              IO.puts("Clean install successful, retrying build...")
              IO.puts(install_output)
              
              # Retry the build
              case System.cmd("npm", ["run", "build", "--emptyOutDir"], stderr_to_stdout: true, cd: ui_path) do
                {retry_output, 0} ->
                  IO.puts("Build successful after clean install!")
                  IO.puts(retry_output)
                  {:ok, []}
                {retry_output, _retry_exit_code} ->
                  IO.puts(:stderr, "Build failed even after clean install:")
                  IO.puts(:stderr, retry_output)
                  {:error, []}
              end
            {install_output, _install_exit_code} ->
              IO.puts(:stderr, "Clean install failed:")
              IO.puts(:stderr, install_output)
              {:error, []}
          end
        else
          {:error, []}
        end
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
