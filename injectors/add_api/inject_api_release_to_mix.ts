import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { ApiAppData } from "../../generators/add_api";

const inject_api_release_to_mix = async ({ UmbrellaDir, AppNameSnake, ApiNameSnake }: ApiAppData) => {
  const file = path.join(UmbrellaDir, "mix.exs");
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;

  const content = `,
        ${apiAppName}: [
          applications: [${apiAppName}: :permanent, ${AppNameSnake}: :permanent],
          include_erts: true,
          include_src: false
        ]`;

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      new RegExp(`${AppNameSnake}_web:[\\s\\S]*?include_src: false[\\s]*]`),
      content,
    ],
  ];

  return inject_file({ file, injections }, "inject_api_release_to_mix");
};

export { inject_api_release_to_mix };

