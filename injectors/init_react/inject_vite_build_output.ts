import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_vite_build_output = async ({ AppNameSnake, UiDir }: AppData) => {
  const file = path.join(UiDir, "vite.config.ts");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /export\s+default\s+defineConfig\(\{/,
      `\n
  build: {
    outDir: '../${AppNameSnake}_web/priv/static', // Output the build to priv/static/assets
    assetsDir: 'assets', 
  },
`,
    ],
  ];

  return inject_file({ file, injections }, "inject_vite_build_output");
};

export { inject_vite_build_output };
