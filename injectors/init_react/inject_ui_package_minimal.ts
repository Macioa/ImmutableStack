import path from "path";
import { writeFile } from "fs/promises";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const inject_ui_package_minimal = async (appdata: AppData, uiName: string = 'ui') => {
  const { AppNameSnake, AppDir } = appdata;
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const file = path.join(UiDir, "package.json");
  
  const appsNodeModulesPath = path.join(AppDir, "node_modules");
  
  log(
    { level: 2, color: "BLUE" },
    `\nCreating minimal package.json for ${AppNameSnake}_${uiName}...`
  );

  const packageJson = {
    name: `${AppNameSnake}_${uiName}`,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      "test": "jest",
      "postinstall": `if [ -d '../${AppNameSnake}/lib/typescript' ]; then rm -f ../${AppNameSnake}/lib/typescript/node_modules && ln -sf ${appsNodeModulesPath} ../${AppNameSnake}/lib/typescript/node_modules && echo 'Symlink created: ../${AppNameSnake}/lib/typescript/node_modules -> ${appsNodeModulesPath}'; else echo 'Warning: ${AppNameSnake}/lib/typescript directory not found, skipping symlink creation'; fi`,
      "dev": "vite",
      "build": "tsc -b && vite build",
      "lint": "eslint .",
      "format": "prettier --write .",
      "preview": "vite preview"
    }
  };

  await writeFile(file, JSON.stringify(packageJson, null, 2));
  
  return {
    type: "file_created",
    path: file,
    content: `Minimal package.json for ${AppNameSnake}_${uiName} with only scripts and postinstall hook`
  };
};

export { inject_ui_package_minimal };
