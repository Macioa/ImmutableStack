// Elixir helpers for generated files that also compile in prod
const elixirRunCmd = `  defp run_cmd(cmd, args, opts) do
    case :os.type() do
      {:win32, _} -> System.cmd("cmd", ["/c", cmd | args], opts)
      _ -> System.cmd(cmd, args, opts)
    end
  end`;

// Windows uses a junction, which needs no admin rights. rmdir removes only the link.
const elixirLinkDir = `  defp link_dir(target, link) do
    case :os.type() do
      {:win32, _} ->
        System.cmd("cmd", ["/c", "rmdir", win_path(link)], stderr_to_stdout: true)
        System.cmd("cmd", ["/c", "mklink", "/J", win_path(link), win_path(target)], stderr_to_stdout: true)

      _ ->
        File.rm_rf(link)
        File.ln_s(target, link)
    end
  end

  defp win_path(path), do: String.replace(path, "/", "\\\\")`;

export { elixirRunCmd, elixirLinkDir };
