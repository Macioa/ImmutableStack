/*
** Immutable Gen Template **
    Generate a string literal template from existing code
          - requires an enitity name and filepath as arguments
          - use "null" as entity name if code is not entity specific (files created from init project)
*/

import fs from "fs/promises";
import * as path from "path";
import { AppData, AppNames, getAppData } from "./readers/get_app_data";
import { log, setLogLevel } from "./utils/logger";
import {
  getNamesFromSingularSnakeCase as getNames,
  Names,
} from "./utils/string";

setLogLevel(5);

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Please provide an entity name and filepath as arguments.");
    process.exit(1);
  }
  const entityName = args[0];
  const filePath = path.resolve(args[1]);

  const appData = (await getAppData()) as AppData;
  const names = getNames(entityName) as Names;
  delete names?.singleChar;
  const fileContent = await fs.readFile(filePath, "utf-8");

  log({ level: 1, color: "GREEN" }, `Generating from existing code...`);
  log(
    { level: 2, color: "BLUE" },
    `     Entity: ${entityName}. File: ${filePath}`
  );

  const result = createTemplate(names, appData, fileContent);

  log({ level: 1, color: "GREEN" }, `\n\nResult:\n\n`);
  log({ level: 1, color: "BLUE" }, result);
  log({ level: 1, color: "GREEN" }, `\n\ Complete.`);
};

main().catch(console.error);

type NameKey = keyof Names;
type AppKey = keyof AppNames;

const createTemplate = (
  entityNames: Names,
  { AppNameCamel, AppNameSnake, AppNameCaps }: AppData,
  file: string
): string => {
  const appData: AppNames = { AppNameCamel, AppNameSnake, AppNameCaps };

  // Generate operations for replacing enitity and app names
  const entityNameOperations: [string, (str: string) => string][] = Object.keys(
    entityNames
  )
    .reverse()
    .map((key) => {
      const value = entityNames[key as NameKey] || "";
      return [
        `replace_${value}`,
        (str: string) => str?.replaceAll(value, `\$\{${key}\}`),
      ];
    });
  const appNameOperations: [string, (str: string) => string][] = Object.keys(
    appData
  ).map((key) => {
    return [
      `replace_${appData[key as AppKey]}`,
      (str: string) => str?.replaceAll(AppNameCamel, `\$\{${key}\}`),
    ];
  });

  // Concat operations
  const operationResults: { [key: string]: string | object } = {},
    operations: [string, (str: string) => string][] = [
      ["escape_chars", (str) => str?.replace(/\\/g, "\\\\")],
      ...entityNameOperations,
      ...appNameOperations,
      ["result", (str) => str],
    ];

  // Apply operations to file content
  try {
    const _parsedFile = operations.reduce((acc, [name, fn]) => {
      const newContent = fn(acc as unknown as string);
      operationResults[name] = newContent;
      return newContent;
    }, file);
  } catch (e) {
    console.error("Error generating template from file:");
    console.log("Original String:", file);
    for (let key of Object.keys(operationResults))
      console.log(`${key}:\n`, `${operationResults[key]}`, "\n\n");
    console.error(e);
    throw e;
  }

  return operationResults.result as string;
};
