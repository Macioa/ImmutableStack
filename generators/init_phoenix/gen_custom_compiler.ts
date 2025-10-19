import { join } from "@/utils/path";
import { generateFile } from "@/generators/index";
import { AppData } from "@/readers/get_app_data";

const gen_custom_compiler = async ({
  AppNameSnake,
  AppNameCamel,
  LibDir,
  AppDir
}: AppData, uiName: string = 'ui') => {
  const compilerPath = join(LibDir, `/lib/mix/tasks`);

  const content = `
defmodule Mix.Tasks.Compile.CustomCompiler do
  use Mix.Task.Compiler

  @impl Mix.Task.Compiler
  def run(_args) do
    %{${AppNameSnake}: app_path} = Mix.Project.deps_paths()

    project_uis = [
      {"npm run build:${uiName}", Path.join([app_path, "./..", "${AppNameSnake}_${uiName}"]) |> Path.expand()}
    ]

    typescript_path =
      Path.join([app_path, "lib", "typescript"])
      |> Path.expand()

    # Generate env files for all UI projects
    Enum.each(project_uis, fn {_build_cmd, ui_path} ->
      ${AppNameCamel}.Tasks.ExportConfig.generate_env_file(ui_path)
    end)

    # Create symlink if paths exist
    typescript_node_modules = Path.join(typescript_path, "node_modules")
    apps_node_modules = Path.join("${AppDir}", "node_modules")
    
    if File.exists?(typescript_path) and File.exists?(apps_node_modules) do
      File.rm_rf(typescript_node_modules)
      File.ln_s(apps_node_modules, typescript_node_modules)
      IO.puts("Symlink created: #{typescript_node_modules} -> #{apps_node_modules}")
    else
      IO.puts("Warning: TypeScript directory or apps node_modules not found, skipping symlink creation")
    end

    # Build all UI projects with retry on dependency errors
    Enum.each(project_uis, fn {build_cmd, _ui_path} ->
      build_with_retry("${AppDir}", build_cmd)
    end)
  end

  defp build_with_retry(apps_path, build_cmd) do
    [cmd | args] = String.split(build_cmd, " ")
    case System.cmd(cmd, args ++ ["--emptyOutDir"], stderr_to_stdout: true, cd: apps_path) do
      {output, 0} ->
        IO.puts(output)
        {:ok, []}
      {output, _exit_code} ->
        IO.puts(:stderr, output)
        
        if dependency_error?(output) do
          IO.puts("Detected dependency error, attempting clean install...")
          retry_after_clean_install(apps_path, build_cmd)
        else
          {:error, []}
        end
    end
  end

  defp retry_after_clean_install(apps_path, build_cmd) do
    case System.cmd("npm", ["ci"], stderr_to_stdout: true, cd: apps_path) do
      {install_output, 0} ->
        IO.puts("Clean install successful, retrying build...")
        IO.puts(install_output)
        
        [cmd | args] = String.split(build_cmd, " ")
        case System.cmd(cmd, args ++ ["--emptyOutDir"], stderr_to_stdout: true, cd: apps_path) do
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
  end

  defp dependency_error?(output) do
    String.contains?(output, "@rollup/rollup-darwin-arm64") or 
    String.contains?(output, "Cannot find module") or
    String.contains?(output, "npm has a bug related to optional dependencies")
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
