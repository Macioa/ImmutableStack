import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_viteconfig = async (AppNameSnake: string, UiDir: string) => {
  const file = path.join(UiDir, "vite.config.ts");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /export\s+default\s+defineConfig\(\{[\s\n]+plugins\:\s+\[react\(\)\]\,/,
      `\n
  resolve: {
    alias: {
      '@utils': path.resolve(__dirname, '../${AppNameSnake}/lib/typescript/utils'),
      '@state': path.resolve(__dirname, '../${AppNameSnake}/lib/typescript/state'),
      '@requests': path.resolve(__dirname, '../${AppNameSnake}/lib/typescript/requests'),
      '@components': path.resolve(__dirname, '../${AppNameSnake}/lib/typescript/components'),
      '@test': path.resolve(__dirname, 'src/test')
    }
  },
`,
    ],
    [InjectType.BEFORE, /import\s+react/, `import path from 'path';\n`],
  ];

  return inject_file({ file, injections }, "inject_viteconfig");
};

const inject_tsconfig = async (AppNameSnake: string, UiDir: string) => {
  const file = path.join(UiDir, "tsconfig.app.json");

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /"compilerOptions":\s+\{/,
      `\n
  "baseUrl": "../../",
  "paths": {
    "@utils/*": ["apps/${AppNameSnake}/lib/typescript/utils/*"],
    "@state/*": ["apps/${AppNameSnake}/lib/typescript/state/*"],
    "@requests/*": ["apps/${AppNameSnake}/lib/typescript/requests/*"],
    "@components/*": ["apps/${AppNameSnake}/lib/typescript/components/*"]
  },
`,
    ],
  ];

  return inject_file({ file, injections }, "inject_tsconfig");
};

const inject_build_aliases = async (AppNameSnake: string, UiDir: string) =>
  Promise.all([
    inject_viteconfig(AppNameSnake, UiDir),
    inject_tsconfig(AppNameSnake, UiDir),
  ]);

export { inject_viteconfig, inject_tsconfig, inject_build_aliases };
