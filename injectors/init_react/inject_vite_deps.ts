import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_vite_deps = async (UiDir: string) => {
  const file = path.join(UiDir, "package.json");
  const injections: Injection[] = [
    [InjectType.AFTER, /\"devDependencies\":\s+\{/, `\n    "vite": "^6.0.0",`],
  ];

  return inject_file({ file, injections }, "inject_vite_deps");
};

export { inject_vite_deps };
