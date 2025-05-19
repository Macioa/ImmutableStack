import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_jest_config = async ({ AppNameSnake, UiDir }: AppData) => {
  const content = `
export default {
    globals: {
        "ts-jest": {
        tsconfig: "<rootDir>/../${AppNameSnake}_ui/tsconfig.app.json",
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

const gen_jest_setup = async ({ UiDir }: AppData) => {
  const content = `
require("@testing-library/jest-dom");
            `;

  return generateFile(
    { dir: UiDir, filename: "jest.setup.js", content },
    "gen_jest_setup"
  );
};

export { gen_jest_config, gen_jest_setup };
