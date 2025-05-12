/*
** Immutable Gen Template **
    Generate a string literal template from existing code
          - requires an enitity name and filepath as arguments
          - use "null" as entity name if code is not entity specific (files created from init project)
*/

import * as path from "path";
import fs from "fs/promises";

import { getAppData, AppData, AppNames } from "./readers/get_app_data";
import {
  getNamesFromSingularSnakeCase as getNames,
  Names,
} from "./utils/string";
import { log, setLogLevel } from "./utils/logger";
import { ImmutableGenerator } from "./immutable_gen";

setLogLevel(5);

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("Please provide an entity name and filepath as arguments.");
    process.exit(1);
  }
  const entityName = args[0];
  // const filePath = path.resolve(args[1]);

  const appData = (await getAppData()) as AppData;
  const name = getNames(entityName) as Names;
  delete name.singleChar;

  
};

main().catch(console.error);

