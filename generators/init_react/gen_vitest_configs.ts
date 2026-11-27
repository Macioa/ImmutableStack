import path from "path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";

const uiDir = ({ AppNameSnake, AppDir }: AppData, uiName: string) =>
  path.join(AppDir, `${AppNameSnake}_${uiName}`);

const gen_vitest_config = async (appdata: AppData, uiName: string = "ui") => {
  const { AppNameSnake } = appdata;
  const content = `import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./vitest.setup.ts"],
      include: [
        "src/**/*.test.{ts,tsx}",
        "../${AppNameSnake}/lib/typescript/{state,requests,utils,components}/**/*.test.{ts,tsx}",
      ],
      passWithNoTests: true,
    },
  })
);
`;

  return generateFile(
    { dir: uiDir(appdata, uiName), filename: "vitest.config.ts", content },
    "gen_vitest_config"
  );
};

const gen_vitest_setup = async (appdata: AppData, uiName: string = "ui") =>
  generateFile(
    {
      dir: uiDir(appdata, uiName),
      filename: "vitest.setup.ts",
      content: `import "@testing-library/jest-dom/vitest";\n`,
    },
    "gen_vitest_setup"
  );

const gen_smoke_test = async (appdata: AppData, uiName: string = "ui") =>
  generateFile(
    {
      dir: path.join(uiDir(appdata, uiName), "src", "test"),
      filename: "smoke.test.tsx",
      content: `import { render, screen } from "@testing-library/react";

test("renders into the jsdom document", () => {
  render(<p>immutable</p>);
  expect(screen.getByText("immutable")).toBeInTheDocument();
});
`,
    },
    "gen_smoke_test"
  );

export { gen_vitest_config, gen_vitest_setup, gen_smoke_test };
