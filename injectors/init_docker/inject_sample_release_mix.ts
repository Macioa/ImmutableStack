import { join } from "path";
import { ImmutableGenerator } from "../../immutable_gen";
import { inject_file, Injection, InjectType } from "../../injectors/index";

const inject_sample_release_mix = async (generator: ImmutableGenerator) => {
  const file = join(generator.dir?.ProjectDir || "", "mix.exs");

  const AppNameSnake = generator.appName.snake;
  const content = `\n      releases: [
        your_release_name: [
          applications: [${AppNameSnake}_web: :permanent, ${AppNameSnake}: :permanent],
          include_erts: true,
          include_src: false
        ]
      ],\n`
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