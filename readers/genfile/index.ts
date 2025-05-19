import * as fs from "fs";

import { getAppData } from "../get_app_data";
import { ImmutableGenerator, GenTypes } from "../../immutable_gen";
import { getGenerator } from "./generator";
import { getTypeEquivalents, readAllTypes } from "./typedict";
import { getNamesFromSingularSnakeCase as getNames } from "../../utils/string";
import { log, sleep } from "../../utils/logger";

type GenData = {
  generator: ImmutableGenerator;
  genTypes: GenTypes;
};

const readGenFile = async (filePath: string): Promise<GenData> => {
  const fileContent = fs.readFileSync(filePath, "utf8");

  log({ level: 3, color: "BLUE" }, `\nReading genfile: ${filePath}`);

  log({ level: 5 }, "Analyzing types...");
  const typeDict = getTypeEquivalents(fileContent);
  
  log({ level: 5 }, "Reading generator...");
  const genFileParsed = (await getGenerator(
    fileContent
  )) as unknown as ImmutableGenerator;

  const generator = {
    ...genFileParsed,
    name: getNames(genFileParsed?.name as unknown as string) || {},
    AppData: await getAppData(),
  } as ImmutableGenerator;


  log({ level: 3, color: "BLUE" }, `Found app:`);
  await log({ level: 3, color: "GREEN" }, `      ${generator.AppData.AppNameCamel}`);


  await log({ level: 3, color: "BLUE" }, "Generator: \n", generator);
  const gen = generator.generate,
    genLists: [string, string[] | undefined][] = [
      ["ControllerRoutes", gen.http_controller?.routes],
      ["ContextFunctions", gen.context?.apiFunctions],
      ["Requests", gen.requests?.requestFunctions],
      ["Reducers", gen.stateSlice?.reducers],
      ["Selectors", gen.stateSlice?.selectors],
    ];
  genLists.forEach(([name, array]) =>
    log({ level: 3, color: "YELLOW" }, `${name}:`, array)
  );
  await sleep(2);

  const genTypes = readAllTypes(fileContent, typeDict);
  await log({ level: 3, color: "BLUE" }, "TypeDict: \n", genTypes);

  return { generator, genTypes } as GenData;
};

export { readGenFile };
