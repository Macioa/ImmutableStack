import { readFile } from "fs/promises";

const getAppName = async () => {
  try {
    const fileContent = await readFile("mix.exs", "utf-8");
    let appName;
    fileContent.replace(
      /defmodule (\w+)(\.Umbrella){0,1}\.MixProject do/g,
      (m, n) => (appName = n)
    );
    console.log(`Found app: ${appName}`)
    return appName;
  } catch (error) {
    console.error(`Could not get AppName from mix.exs`);
  }
};

export { getAppName };
