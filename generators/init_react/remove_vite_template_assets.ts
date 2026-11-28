import path from "path";
import fs from "fs";
import { AppData } from "../../readers/get_app_data";

// create-vite's demo files the Immutable page does not use (its favicon is the Vite logo)
const TEMPLATE_ASSETS = [
  "public/favicon.svg",
  "public/icons.svg",
  "src/assets/hero.png",
  "src/assets/vite.svg",
];

const remove_vite_template_assets = async ({ AppNameSnake, AppDir }: AppData, uiName: string = "ui") => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const files = TEMPLATE_ASSETS.map((file) => path.join(UiDir, file)).filter((file) => fs.existsSync(file));
  await Promise.all(files.map((file) => fs.promises.rm(file, { force: true })));
  return files.map((file) => ({ type: "file_deleted", path: file }));
};

export { remove_vite_template_assets };
