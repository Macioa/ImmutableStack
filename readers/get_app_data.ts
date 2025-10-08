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

async function findViteProjects(appsDir: string): Promise<string[]> {
  if (!existsSync(appsDir)) {
    return [];
  }

  try {
    const entries = await readdir(appsDir, { withFileTypes: true });
    const viteProjectsWithAge: Array<{ path: string; birthtime: Date }> = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(appsDir, entry.name);
        const viteConfigPath = path.join(dirPath, "vite.config.ts");
        
        if (existsSync(viteConfigPath)) {
          const stats = await stat(dirPath);
          viteProjectsWithAge.push({
            path: dirPath,
            birthtime: stats.birthtime,
          });
        }
      }
    }

    viteProjectsWithAge.sort((a, b) => a.birthtime.getTime() - b.birthtime.getTime());

    return viteProjectsWithAge.map(p => p.path);
  } catch (error) {
    log({ level: 8 }, `Error finding Vite projects in ${appsDir}: ${error}`);
    return [];
  }
}

async function findPhoenixWebApis(appsDir: string): Promise<string[]> {
  if (!existsSync(appsDir)) {
    return [];
  }

  try {
    const entries = await readdir(appsDir, { withFileTypes: true });
    const phoenixApisWithAge: Array<{ path: string; birthtime: Date }> = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const dirPath = path.join(appsDir, entry.name);
        const mixExsPath = path.join(dirPath, "mix.exs");
        
        if (existsSync(mixExsPath)) {
          // Check for router.ex file which indicates a Phoenix web app with API support
          const libPath = path.join(dirPath, "lib");
          if (existsSync(libPath)) {
            const libEntries = await readdir(libPath, { withFileTypes: true });
            for (const libEntry of libEntries) {
              if (libEntry.isDirectory()) {
                const routerPath = path.join(libPath, libEntry.name, "router.ex");
                if (existsSync(routerPath)) {
                  const stats = await stat(dirPath);
                  phoenixApisWithAge.push({
                    path: dirPath,
                    birthtime: stats.birthtime,
                  });
                  break; // Found router, no need to check other lib subdirs
                }
              }
            }
          }
        }
      }
    }

    phoenixApisWithAge.sort((a, b) => a.birthtime.getTime() - b.birthtime.getTime());

    return phoenixApisWithAge.map(p => p.path);
  } catch (error) {
    log({ level: 8 }, `Error finding Phoenix Web APIs in ${appsDir}: ${error}`);
    return [];
  }
}

const getDirs = async (AppNameSnake: string, home: boolean = true) => {
  const curDir = process.cwd();
  const UmbrellaDir = home
      ? curDir
      : path.join(curDir, `${AppNameSnake}_umbrella`),
    AppDir = path.join(UmbrellaDir, "apps"),
    LibDir = path.join(AppDir, AppNameSnake),
    WebDir = path.join(AppDir, `${AppNameSnake}_web`);
  
  const UiDirs = await findViteProjects(AppDir);
  const WebApiDirs = await findPhoenixWebApis(AppDir);
  
  return { AppDir, LibDir, UiDirs, WebApiDirs, WebDir, UmbrellaDir };
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
  const dirs = await getDirs(names.AppNameSnake);
  return {
    ...names,
    ...dirs,
  };
};

const appDataFromAppnNameSnake = async (AppNameSnake: string, home: boolean = true) => {
  const AppNameCamel = AppNameSnake?.replace(/_([a-z])/g, (g) =>
    g[1].toUpperCase()
  )?.replace(/^./, (g) => g.toUpperCase());
  const names = getNames(AppNameCamel);
  const dirs = await getDirs(names.AppNameSnake, home);
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

    return await appDataFromAppnNameCamel(AppNameCamel) as AppData;
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
