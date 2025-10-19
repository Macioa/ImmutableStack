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
      "@reduxjs/toolkit": "^2.3.0",
      "@types/react-redux": "^7.1.34",
      "deepmerge": "^4.3.1",
      "react-redux": "^9.1.2",
      "mincurrypipe": "^3.0.0",
      "phoenix": "^1.7.21",
      "react": "^19.1.0",
      "react-dom": "^19.1.0"
    },
    devDependencies: {
      "@babel/plugin-transform-private-property-in-object": "^7.25.9",
      "@originjs/vite-plugin-federation": "^1.3.5",
      "@types/node": "^22.10.0",
      "lorem-ipsum": "^2.0.8",
      "@types/phoenix": "^1.6.6",
      "@testing-library/jest-dom": "^6.6.3",
      "@testing-library/react": "^16.3.0",
      "@testing-library/user-event": "^14.6.1",
      "@types/jest": "^29.5.14",
      "jest": "^29.7.0",
      "jest-environment-jsdom": "^29.7.0",
      "ts-jest": "^29.3.2",
      "@eslint/js": "^9.25.0",
      "@types/react": "^19.1.2",
      "@types/react-dom": "^19.1.2",
      "@vitejs/plugin-react": "^4.4.1",
      "eslint": "^9.25.0",
      "eslint-plugin-react-hooks": "^5.2.0",
      "eslint-plugin-react-refresh": "^0.4.19",
      "globals": "^16.0.0",
      "typescript": "~5.8.3",
      "typescript-eslint": "^8.30.1",
      "vite": "^6.3.5",
      "prettier": "^3.4.2"
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
