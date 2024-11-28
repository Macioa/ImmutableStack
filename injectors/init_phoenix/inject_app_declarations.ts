import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_app_declarations = async (
  AppNameSnake: string,
  AppDir: string,
) => {
  const file = path.join(AppDir, "mix.exs");
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
