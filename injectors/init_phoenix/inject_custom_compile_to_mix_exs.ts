import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_custom_compile_to_web_mix_exs = async ({ WebDir }: AppData) => {
  const file = path.join(WebDir, `mix.exs`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /def\sproject\s+do[\s\n]+\[/,
      `compilers: Mix.compilers() ++ [:custom_compiler],\n`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_custom_compile_to_web_mix_exs"
  );
};

const inject_custom_compile_to_app_mix_exs = async ({
  UmbrellaDir,
}: AppData) => {
  const file = path.join(UmbrellaDir, `mix.exs`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /def\sproject\s+do[\s\n]+\[/,
      `compilers: Mix.compilers() ++ [:custom_compiler],\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_custom_compile_to_mix_exs");
};
const inject_custom_compile_to_mix_exs = async (appdata: AppData) =>
  Promise.all([
    inject_custom_compile_to_app_mix_exs(appdata),
    inject_custom_compile_to_web_mix_exs(appdata),
  ]);

export {
  inject_custom_compile_to_mix_exs,
  inject_custom_compile_to_app_mix_exs,
  inject_custom_compile_to_web_mix_exs,
};
