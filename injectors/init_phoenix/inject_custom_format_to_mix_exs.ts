import path from "path";
import { AppData } from "../../readers/get_app_data";
import { inject_file, Injection, InjectType } from "../index";

const inject_custom_format_to_mix_exs = async ({ LibDir }: AppData) => {
  const file = path.join(LibDir, `mix.exs`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /defp\s+aliases\s+do[\s\n]+\[/s,
      `\nformat: "custom_formatter",`,
    ],
  ];

  return inject_file({ file, injections }, "inject_custom_format_to_mix_exs");
};

export { inject_custom_format_to_mix_exs };
