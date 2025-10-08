import path from "path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";

const gen_jest_config = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'temp_ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const content = `
export default {
    globals: {
        "ts-jest": {
        tsconfig: "<rootDir>/../${AppNameSnake}_${uiName}/tsconfig.app.json",
        },
    },
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleNameMapper: {
      "^@utils/(.*)$": "<rootDir>/../${AppNameSnake}/lib/typescript/utils/$1",
      "^@state/(.*)$": "<rootDir>/../${AppNameSnake}/lib/typescript/state/$1",
      "^@requests/(.*)$": "<rootDir>/../${AppNameSnake}/lib/typescript/requests/$1",
      "^@components/(.*)$": "<rootDir>/../${AppNameSnake}/lib/typescript/components/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    roots: ["<rootDir>", "../${AppNameSnake}/lib/typescript/state"],
  };
        `;

  return generateFile(
    { dir: UiDir, filename: "jest.config.js", content },
    "gen_jest_config"
  );
};

const gen_jest_setup = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'temp_ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const content = `
require("@testing-library/jest-dom");
            `;

  return generateFile(
    { dir: UiDir, filename: "jest.setup.js", content },
    "gen_jest_setup"
  );
};

export { gen_jest_config, gen_jest_setup };
