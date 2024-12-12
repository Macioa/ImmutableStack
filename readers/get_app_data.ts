import { readFile } from "fs/promises";
import path from "path";
import { log } from "../utils/logger";

const getAppData = async () => {
  try {
    log({ level: 8 }, `Getting App Data from mix.exs in ${process.cwd()}`);
    const fileContent = await readFile("mix.exs", "utf-8");
    const appName = fileContent.match(
      /(?<=defmodule\s+)\w+(?=\.Umbrella\.MixProject)/
    )?.[0];

    const appNameSnake = appName
      ?.replace(/([A-Z])/g, "_$1")
      ?.toLowerCase()
      ?.slice(1);

    const umbrellaDir = process.cwd(),
      appdir = path.join(umbrellaDir, "apps"),
      libdir = path.join(appdir, appNameSnake as string),
      uidir = path.join(appdir, `${appNameSnake}_ui`),
      webdir = path.join(appdir, `${appNameSnake}_web`);

    return {
      AppNameCamel: appName,
      AppNameSnake: appNameSnake,
      ProjectDir: umbrellaDir,
      AppDir: appdir,
      LibDir: libdir,
      UiDir: uidir,
      WebDir: webdir,
      UmbrellaDir: umbrellaDir,
    };
  } catch (error) {
    console.error(`Could not get AppName from mix.exs\n${error}`);
  }
};

export { getAppData };
