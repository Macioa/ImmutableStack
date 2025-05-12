import { join } from "path";
import { inject_file, Injection, InjectType } from "../../injectors/index";
import { AppData } from "../../readers/get_app_data";

const inject_sample_release_mix = async ({
  UmbrellaDir,
  AppNameSnake,
}: AppData) => {
  const file = join(UmbrellaDir || "", "mix.exs");

  const content = `\n      releases: [
        your_release_name: [
          applications: [${AppNameSnake}_web: :permanent, ${AppNameSnake}: :permanent],
          include_erts: true,
          include_src: false
        ]
      ],\n`;
  const injections: Injection[] = [
    [InjectType.AFTER, /\s*def\s+project\s+do\s+\[/gm, content],
  ];
  return inject_file(
    {
      file,
      injections,
    },
    "inject_sample_release_mix"
  );
};

export { inject_sample_release_mix };
