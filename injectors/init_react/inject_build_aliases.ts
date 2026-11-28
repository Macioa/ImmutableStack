import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_viteconfig = async (AppNameSnake: string, UiDir: string) => {
  const file = path.join(UiDir, "vite.config.ts");
  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /export\s+default\s+defineConfig\(\{[\s\n]+plugins\:\s+\[react\(\)\]\,/,
      `\n
  resolve: {
    // One React and antd for the app and the shared lib/typescript code (Windows can reach
    // a package by two paths that differ only in drive-letter case)
    dedupe: ['react', 'react-dom', 'antd'],
    alias: {
      '@utils': path.resolve(import.meta.dirname, '../${AppNameSnake}/lib/typescript/utils'),
      '@state': path.resolve(import.meta.dirname, '../${AppNameSnake}/lib/typescript/state'),
      '@requests': path.resolve(import.meta.dirname, '../${AppNameSnake}/lib/typescript/requests'),
      '@components': path.resolve(import.meta.dirname, '../${AppNameSnake}/lib/typescript/components'),
      '@test': path.resolve(import.meta.dirname, 'src/test')
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
  "paths": {
    "@utils/*": ["../${AppNameSnake}/lib/typescript/utils/*"],
    "@state/*": ["../${AppNameSnake}/lib/typescript/state/*"],
    "@requests/*": ["../${AppNameSnake}/lib/typescript/requests/*"],
    "@components/*": ["../${AppNameSnake}/lib/typescript/components/*"]
  },
`,
    ],
    [
      InjectType.REPLACE,
      /"types":\s*\["vite\/client"\]/,
      `"types": ["vite/client", "vitest/globals", "@testing-library/jest-dom/vitest"]`,
    ],
  ];

  return inject_file({ file, injections }, "inject_tsconfig");
};

const inject_build_aliases = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  return Promise.all([
    inject_viteconfig(AppNameSnake, UiDir),
    inject_tsconfig(AppNameSnake, UiDir),
  ]);
};

export { inject_viteconfig, inject_tsconfig, inject_build_aliases };
