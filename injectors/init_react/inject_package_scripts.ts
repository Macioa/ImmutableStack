import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_package_scripts = async ({ AppNameSnake, UiDir }: AppData) => {
  const file = path.join(UiDir, "package.json");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /\"scripts\":\s+\{/,
      `\n    "postinstall": "ln -sf $(pwd)/node_modules ../${AppNameSnake}/lib/typescript/node_modules",`,
    ],
  ];

  return inject_file({ file, injections }, "inject_package_scripts");
};

export { inject_package_scripts };
