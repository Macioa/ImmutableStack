import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_deps_get_aliases_to_mix_exs = async (
  AppName: string,
  umbrellaDir: string,
) => {
  const file = path.join(umbrellaDir, `mix.exs`);
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /defp\s+aliases\s+do[\s\n]+\[/,
      `
  defp npm_install(_) do
    Mix.shell().cmd("npm install", cd: "apps/${AppName}_ui")
  end\n\n
`,
    ],
    [
      InjectType.AFTER,
      /defp\s+aliases\s+do[\s\n]+\[/,
      `\n"deps.get": ["deps.get", &npm_install/1],`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_deps_get_aliases_to_mix_exs",
  );
};

export { inject_deps_get_aliases_to_mix_exs };
