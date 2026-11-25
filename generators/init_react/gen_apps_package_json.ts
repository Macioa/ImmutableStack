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
      "dev": `npm run dev:ui`,
      [`build:ui`]: `cd ${AppNameSnake}_ui && tsc -b && vite build`,
      "build": `npm run build:ui`,
      [`test:ui`]: `cd ${AppNameSnake}_ui && jest`,
      "test": `npm run test:ui`
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
      "@babel/plugin-transform-private-property-in-object": "^8.1.3",
      "@originjs/vite-plugin-federation": "^1.4.1",
      "@types/node": "^24.10.0",
      "lorem-ipsum": "^3.0.0",
      "@types/phoenix": "^1.6.8",
      "@testing-library/jest-dom": "^8.0.0",
      "@testing-library/react": "^16.3.3",
      "@testing-library/user-event": "^14.6.13",
      "@types/jest": "^30.0.0",
      "jest": "^30.5.2",
      "jest-environment-jsdom": "^30.5.2",
      "ts-jest": "^29.4.15",
      "@eslint/js": "^10.0.1",
      "@types/react": "^19.3.3",
      "@types/react-dom": "^19.3.0",
      "@vitejs/plugin-react": "^6.3.0",
      "eslint": "^10.15.0",
      "eslint-plugin-react-hooks": "^7.1.1",
      "eslint-plugin-react-refresh": "^0.5.8",
      "globals": "^17.14.0",
      "typescript": "~6.0.3",
      "typescript-eslint": "^8.74.0",
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
