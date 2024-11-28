import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_custom_compile_to_mix_exs = async (
  AppName: string,
  WebDir: string,
) => {
  const file = path.join(WebDir, `mix.exs`);
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /def\sproject\s+do[\s\n]+\[/,
      `compilers: Mix.compilers() ++ [:custom_compiler],\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_custom_compile_to_mix_exs");
};

export { inject_custom_compile_to_mix_exs };
