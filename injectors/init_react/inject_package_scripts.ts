import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_package_scripts = async (AppName: string, UiDir: string) => {
  const file = path.join(UiDir, "package.json");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /\"scripts\":\s+\{/,
      `\n    "postinstall": "ln -s $(pwd)/node_modules ../${AppName}/lib/typescript/node_modules",`,
    ],
  ];

  return inject_file({ file, injections }, "inject_package_scripts");
};

export { inject_package_scripts };
