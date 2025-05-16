import { generateFile } from "../index";

const gen_jest_config = async (AppName: string, UiDir: string) => {
  const content = `
export default {
    globals: {
        "ts-jest": {
        tsconfig: "<rootDir>/../${AppName}_ui/tsconfig.app.json",
        },
    },
    preset: "ts-jest",
    testEnvironment: "jsdom",
    moduleNameMapper: {
      "^@utils/(.*)$": "<rootDir>/../${AppName}/lib/typescript/utils/$1",
      "^@state/(.*)$": "<rootDir>/../${AppName}/lib/typescript/state/$1",
      "^@requests/(.*)$": "<rootDir>/../${AppName}/lib/typescript/requests/$1",
      "^@components/(.*)$": "<rootDir>/../${AppName}/lib/typescript/components/$1",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    roots: ["<rootDir>", "../${AppName}/lib/typescript/state"],
  };
        `;

  return generateFile(
    { dir: UiDir, filename: "jest.config.js", content },
    "gen_jest_config"
  );
};

const gen_jest_setup = async (UiDir: string) => {
  const content = `
require("@testing-library/jest-dom");
            `;

  return generateFile(
    { dir: UiDir, filename: "jest.setup.js", content },
    "gen_jest_setup"
  );
};

export { gen_jest_config, gen_jest_setup };
