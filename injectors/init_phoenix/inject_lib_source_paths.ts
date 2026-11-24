import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const DEFAULT_PATHS = /  defp elixirc_paths\(:test\), do: \["lib", "test\/support"\]\n  defp elixirc_paths\(_\), do: \["lib"\]\n/;

const LIB_PATHS = `  defp elixirc_paths(:test), do: lib_paths() ++ ["test/support"]
  defp elixirc_paths(_), do: lib_paths()

  # lib/typescript links to node_modules, so Mix must not scan it for Elixir sources
  defp lib_paths, do: "lib/*" |> Path.wildcard() |> Enum.reject(&(&1 == "lib/typescript"))
`;

// Scanning the linked node_modules made every dev reload take about a minute on Windows bind mounts
const inject_lib_source_paths = async ({ LibDir }: AppData) => {
  const file = path.join(LibDir, "mix.exs");
  const injections: Injection[] = [[T.REPLACE, DEFAULT_PATHS, LIB_PATHS]];
  return inject_file({ file, injections }, "inject_lib_source_paths");
};

export { inject_lib_source_paths };
