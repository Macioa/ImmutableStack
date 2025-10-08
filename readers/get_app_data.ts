import { readFile, readdir, stat } from "fs/promises";
import path from "path";
import { log } from "@/utils/logger";
import { existsSync } from "fs";

type AppNames = {
  AppNameCamel: string;
  AppNameSnake: string;
  AppNameCaps: string;
};
type AppDirs = {
  AppDir: string;
  LibDir: string;
  UiDirs: string[];
  WebApiDirs: string[];
  WebDir: string;
  UmbrellaDir: string;
};
type AppData = AppNames & AppDirs;

const sortByBirthtime = (results: Array<{ path: string; birthtime: Date } | null>): string[] =>
  results
    .filter((p): p is { path: string; birthtime: Date } => p !== null)
    .sort((a, b) => a.birthtime.getTime() - b.birthtime.getTime())
    .map(p => p.path);

async function findViteProjects(appsDir: string): Promise<string[]> {
  if (!existsSync(appsDir)) return [];

  const entries = await readdir(appsDir, { withFileTypes: true });
  
  const results = await Promise.all(
    entries
      .filter(entry => entry.isDirectory())
      .map(async entry => {
        const dirPath = path.join(appsDir, entry.name);
        if (!existsSync(path.join(dirPath, "vite.config.ts"))) return null;
        
        const stats = await stat(dirPath);
        return { path: dirPath, birthtime: stats.birthtime };
      })
  );

  return sortByBirthtime(results);
}

async function findPhoenixWebApis(appsDir: string): Promise<string[]> {
  if (!existsSync(appsDir)) return [];

  const entries = await readdir(appsDir, { withFileTypes: true });
  
  const results = await Promise.all(
    entries
      .filter(entry => entry.isDirectory())
      .map(async entry => {
        const dirPath = path.join(appsDir, entry.name);
        if (!existsSync(path.join(dirPath, "mix.exs"))) return null;

        const libPath = path.join(dirPath, "lib");
        if (!existsSync(libPath)) return null;

        const libEntries = await readdir(libPath, { withFileTypes: true });
        const hasRouter = libEntries
          .filter(libEntry => libEntry.isDirectory())
          .some(libEntry => existsSync(path.join(libPath, libEntry.name, "router.ex")));

        if (!hasRouter) return null;

        const stats = await stat(dirPath);
        return { path: dirPath, birthtime: stats.birthtime };
      })
  );

  return sortByBirthtime(results);
}

const getDirs = async (AppNameSnake: string, home: boolean = true) => {
  const curDir = process.cwd();
  const UmbrellaDir = home ? curDir : path.join(curDir, `${AppNameSnake}_umbrella`);
  const AppDir = path.join(UmbrellaDir, "apps");
  const [UiDirs, WebApiDirs] = await Promise.all([
    findViteProjects(AppDir),
    findPhoenixWebApis(AppDir)
  ]);
  
  return { 
    AppDir, 
    LibDir: path.join(AppDir, AppNameSnake), 
    UiDirs, 
    WebApiDirs, 
    WebDir: path.join(AppDir, `${AppNameSnake}_web`), 
    UmbrellaDir 
  };
};

const getNames = (AppNameCamel: string) => {
  const AppNameSnake = AppNameCamel?.replace(/([A-Z])/g, "_$1")
    ?.toLowerCase()
    ?.slice(1);
  const AppNameCaps = AppNameSnake.toUpperCase();
  return { AppNameSnake, AppNameCaps, AppNameCamel };
};

const appDataFromAppnNameCamel = async (AppNameCamel: string) => {
  const names = getNames(AppNameCamel);
  return { ...names, ...await getDirs(names.AppNameSnake) };
};

const appDataFromAppnNameSnake = async (AppNameSnake: string, home: boolean = true) => {
  const AppNameCamel = AppNameSnake
    ?.replace(/_([a-z])/g, g => g[1].toUpperCase())
    ?.replace(/^./, g => g.toUpperCase());
  const names = getNames(AppNameCamel);
  return { ...names, ...await getDirs(names.AppNameSnake, home) };
};

const readAppData = async (): Promise<AppData | null> => {
  log({ level: 8 }, `Getting App Data from mix.exs in ${process.cwd()}`);
  if (!existsSync("mix.exs")) return null;
  
  const fileContent = await readFile("mix.exs", "utf-8");
  const AppNameCamel = fileContent.match(/(?<=defmodule\s+)\w+(?=\.Umbrella\.MixProject)/)?.[0] || "";

  return appDataFromAppnNameCamel(AppNameCamel) as Promise<AppData>;
};

let APPDATA: Promise<AppData | null> | AppData = readAppData();

const setAppData = (AppData: AppData) => {
  APPDATA = AppData;
};

const getAppData = () =>
  APPDATA ? APPDATA as Promise<AppData> : readAppData();

export {
  getAppData,
  appDataFromAppnNameCamel,
  appDataFromAppnNameSnake,
  setAppData,
};
export type { AppData, AppDirs, AppNames };
