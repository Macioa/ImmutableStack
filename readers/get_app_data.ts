import { readFile } from "fs/promises";
import path from "path";
import { log } from "../utils/logger";

type AppNames = {
  AppNameCamel: string;
  AppNameSnake: string;
  AppNameCaps: string;
}
type AppDirs = {
  AppDir: string;
  LibDir: string;
  UiDir: string;
  WebDir: string;
  UmbrellaDir: string;
}
type AppData = AppNames & AppDirs;

const getAppData = async () => {
  try {
    log({ level: 8 }, `Getting App Data from mix.exs in ${process.cwd()}`);
    const fileContent = await readFile("mix.exs", "utf-8");

    const AppNameCamel =
      fileContent.match(
        /(?<=defmodule\s+)\w+(?=\.Umbrella\.MixProject)/
      )?.[0] || "";
    const AppNameSnake = AppNameCamel?.replace(/([A-Z])/g, "_$1")
      ?.toLowerCase()
      ?.slice(1);
    const AppNameCaps = AppNameSnake.toUpperCase();

    const UmbrellaDir = process.cwd(),
      AppDir = path.join(UmbrellaDir, "apps"),
      LibDir = path.join(AppDir, AppNameSnake),
      UiDir = path.join(AppDir, `${AppNameSnake}_ui`),
      WebDir = path.join(AppDir, `${AppNameSnake}_web`);

    return {
      AppNameCamel,
      AppNameSnake,
      AppNameCaps,
      AppDir,
      LibDir,
      UiDir,
      WebDir,
      UmbrellaDir,
    };
  } catch (error) {
    console.error(`Could not get AppName from mix.exs\n${error}`);
  }
};

export type { AppData, AppNames, AppDirs };
export { getAppData };
