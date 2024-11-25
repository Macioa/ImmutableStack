import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_custom_format_to_mix_exs = async (
  LibDir: string
) => {
  const file = path.join(LibDir, `mix.exs`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /defp\s+aliases\s+do[\s\n]+\[/s,
      `\nformat: "custom_formatter",`,
    ],
  ];

  return inject_file({ file, injections });
};

export { inject_custom_format_to_mix_exs };
