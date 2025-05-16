import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_app_declarations = async ({
  AppNameSnake,
  UmbrellaDir,
}: AppData) => {
  const file = path.join(UmbrellaDir, "mix.exs");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /apps_path\:\s\"apps\"\,/,
      `\n  apps: [:${AppNameSnake}, :${AppNameSnake}_web],`,
    ],
  ];

  return inject_file({ file, injections }, "inject_app_declarations");
};

export { inject_app_declarations };
