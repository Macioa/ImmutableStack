import path from "path";
import { readFile, writeFile } from "fs/promises";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const gen_update_apps_package_json = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, AppDir } = appdata;
  const file = path.join(AppDir, "package.json");
  
  log(
    { level: 2, color: "BLUE" },
    `\nUpdating centralized apps/package.json for ${AppNameSnake}_${uiName}...`
  );

  try {
    const existingContent = await readFile(file, 'utf-8');
    const existingPackageJson = JSON.parse(existingContent);
    
    const newScripts = {
      [`dev:${uiName}`]: `cd ${AppNameSnake}_${uiName} && vite`,
      [`build:${uiName}`]: `cd ${AppNameSnake}_${uiName} && tsc -b && vite build`,
      [`test:${uiName}`]: `cd ${AppNameSnake}_${uiName} && vitest run`,
    };
    
    const updatedScripts = {
      ...existingPackageJson.scripts,
      ...newScripts,
      "dev": Object.keys(existingPackageJson.scripts)
        .filter(key => key.startsWith('dev:') && key !== 'dev')
        .map(key => `pnpm run ${key}`)
        .join(' & '),
      "build": Object.keys(existingPackageJson.scripts)
        .filter(key => key.startsWith('build:') && key !== 'build')
        .map(key => `pnpm run ${key}`)
        .join(' && '),
      "test": Object.keys(existingPackageJson.scripts)
        .filter(key => key.startsWith('test:') && key !== 'test')
        .map(key => `pnpm run ${key}`)
        .join(' && '),
    };
    
    const updatedPackageJson = {
      ...existingPackageJson,
      scripts: updatedScripts,
      // Every UI's main.tsx imports the display font fallback
      dependencies: {
        "@fontsource/cinzel": "^5.3.0",
        ...existingPackageJson.dependencies,
      },
    };

    await writeFile(file, JSON.stringify(updatedPackageJson, null, 2));
    
    return {
      type: "file_updated",
      path: file,
      content: `Updated centralized apps/package.json to include ${AppNameSnake}_${uiName} scripts`
    };
  } catch (error) {
    log(
      { level: 2, color: "YELLOW" },
      `\nCreating new centralized apps/package.json for ${AppNameSnake}_${uiName}...`
    );
    
    const packageJson = {
      name: `${AppNameSnake}_ui_apps`,
      version: "1.0.0",
      private: true,
      scripts: {
        [`dev:${uiName}`]: `cd ${AppNameSnake}_${uiName} && vite`,
        "dev": `pnpm run dev:${uiName}`,
        [`build:${uiName}`]: `cd ${AppNameSnake}_${uiName} && tsc -b && vite build`,
        "build": `pnpm run build:${uiName}`,
        [`test:${uiName}`]: `cd ${AppNameSnake}_${uiName} && vitest run`,
        "test": `pnpm run test:${uiName}`
      },
      dependencies: {
        "@fontsource/cinzel": "^5.3.0",
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
        "vite": "^8.3.8"
      }
    };

    await writeFile(file, JSON.stringify(packageJson, null, 2));
    
    return {
      type: "file_created",
      path: file,
      content: `Created centralized apps/package.json with ${AppNameSnake}_${uiName} scripts`
    };
  }
};

export { gen_update_apps_package_json };
