import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_socket_provider = async ({ AppNameCamel, UiDir }: AppData) => {
  const file = path.join(UiDir, "src/App.tsx");
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /import\s+['"]\.\/App\.css['"]/,
      `\nimport { PhoenixSocketProvider } from "@utils/PhoenixSocketContext";\n`,
    ],
    [InjectType.AFTER, /return \(/, `\n<PhoenixSocketProvider>\n`],
    [InjectType.BEFORE, /\)\s*;\s*\}\s*export default App/m, `\n</PhoenixSocketProvider>\n`],
  ];

  return inject_file({ file, injections }, "inject_socket_provider");
};

export { inject_socket_provider };
