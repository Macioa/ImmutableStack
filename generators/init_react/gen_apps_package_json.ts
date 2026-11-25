import path from "path";
import { writeFile } from "fs/promises";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const gen_apps_package_json = async (appdata: AppData) => {
  const { AppNameSnake, AppDir } = appdata;
  const file = path.join(AppDir, "package.json");
  
  log(
    { level: 2, color: "BLUE" },
    `\nGenerating centralized apps/package.json...`
  );

  const packageJson = {
    name: `${AppNameSnake}_ui_apps`,
    version: "1.0.0",
    private: true,
    scripts: {
      [`dev:ui`]: `cd ${AppNameSnake}_ui && vite`,
      "dev": `pnpm run dev:ui`,
      [`build:ui`]: `cd ${AppNameSnake}_ui && tsc -b && vite build`,
      "build": `pnpm run build:ui`,
      [`test:ui`]: `cd ${AppNameSnake}_ui && vitest run`,
      "test": `pnpm run test:ui`
    },
    dependencies: {
      "@reduxjs/toolkit": "^2.15.0",
      "@types/react-redux": "^7.1.35",
      "deepmerge": "^4.3.1",
      "react-redux": "^9.3.1",
      "mincurrypipe": "^3.0.3",
      "phoenix": "^1.8.17",
      "react": "^19.3.1",
      "react-dom": "^19.3.1"
    },
    devDependencies: {
      "@originjs/vite-plugin-federation": "^1.4.1",
      "@types/node": "^24.10.0",
      "lorem-ipsum": "^3.0.0",
      "@types/phoenix": "^1.6.8",
      "@testing-library/dom": "^10.4.2",
      "@testing-library/jest-dom": "^8.0.0",
      "@testing-library/react": "^16.3.3",
      "@testing-library/user-event": "^14.6.13",
      "@types/react": "^19.3.3",
      "@types/react-dom": "^19.3.0",
      "@vitejs/plugin-react": "^6.3.0",
      "jsdom": "^31.0.1",
      "oxlint": "^1.95.0",
      "typescript": "~7.0.2",
      "vitest": "^5.1.2",
      "vite": "^8.3.8",
      "prettier": "^3.10.1"
    }
  };

  await writeFile(file, JSON.stringify(packageJson, null, 2));
  
  return {
    type: "file_created",
    path: file,
    content: "Centralized apps/package.json with all UI dependencies and orchestration scripts"
  };
};

export { gen_apps_package_json };
