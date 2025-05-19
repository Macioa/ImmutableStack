import { readFile } from "fs/promises";
import path from "path";
import { log } from "../utils/logger";
import { existsSync } from "fs";

type AppNames = {
  AppNameCamel: string;
  AppNameSnake: string;
  AppNameCaps: string;
};
type AppDirs = {
  AppDir: string;
  LibDir: string;
  UiDir: string;
  WebDir: string;
  UmbrellaDir: string;
};
type AppData = AppNames & AppDirs;

const getDirs = (AppNameSnake: string, home: boolean = true) => {
  const curDir = process.cwd();
  const UmbrellaDir = home
      ? curDir
      : path.join(curDir, `${AppNameSnake}_umbrella`),
    AppDir = path.join(UmbrellaDir, "apps"),
    LibDir = path.join(AppDir, AppNameSnake),
    UiDir = path.join(AppDir, `${AppNameSnake}_ui`),
    WebDir = path.join(AppDir, `${AppNameSnake}_web`);
  return { AppDir, LibDir, UiDir, WebDir, UmbrellaDir };
};

const getNames = (AppNameCamel: string) => {
  const AppNameSnake = AppNameCamel?.replace(/([A-Z])/g, "_$1")
    ?.toLowerCase()
    ?.slice(1);
  const AppNameCaps = AppNameSnake.toUpperCase();
  return { AppNameSnake, AppNameCaps, AppNameCamel };
};

const appDataFromAppnNameCamel = (AppNameCamel: string) => {
  const names = getNames(AppNameCamel);
  const dirs = getDirs(names.AppNameSnake);
  return {
    ...names,
    ...dirs,
  };
};

const appDataFromAppnNameSnake = (AppNameSnake: string, home: boolean = true) => {
  const AppNameCamel = AppNameSnake?.replace(/_([a-z])/g, (g) =>
    g[1].toUpperCase()
  )?.replace(/^./, (g) => g.toUpperCase());
  const names = getNames(AppNameCamel);
  const dirs = getDirs(names.AppNameSnake, home);
  return {
    ...names,
    ...dirs,
  };
};

const readAppData = async function (): Promise<AppData | null> {
  try {
    log({ level: 8 }, `Getting App Data from mix.exs in ${process.cwd()}`);
    if (!existsSync("mix.exs")) return null;
    const fileContent = await readFile("mix.exs", "utf-8");

    const AppNameCamel =
      fileContent.match(
        /(?<=defmodule\s+)\w+(?=\.Umbrella\.MixProject)/
      )?.[0] || "";

    return appDataFromAppnNameCamel(AppNameCamel) as AppData;
  } catch (error) {
    console.error(`Could not get AppName from mix.exs\n${error}`);
    return null;
  }
};

let APPDATA: Promise<AppData | null> | AppData = readAppData();

const setAppData = (AppData: AppData) => {
  APPDATA = AppData;
};

const getAppData = () =>
  APPDATA ? (APPDATA as Promise<AppData>) : readAppData();

export {
  getAppData,
  appDataFromAppnNameCamel,
  appDataFromAppnNameSnake,
  setAppData,
};
export type { AppData, AppDirs, AppNames };
