import { exec } from "child_process";
import { log } from "../utils/logger";
import { inject_router } from "../injectors/inject_router";
import { gen_json } from "./phx_gen_json";

const handle_phx_gen = async (generator: any, typeDict: any) => {
  const gen = generator.generate;
  let res = null;
  if (gen.http_controller && gen.context && gen.schema && gen.databaseModel)
    res = await handle_json(generator, typeDict);
  else if (gen.context && gen.schema && gen.databaseModel)
    res = await gen_context(generator, typeDict);
  else if (gen.schema && gen.databaseModel)
    res = await gen_schema(generator, typeDict);
  else console.log("Invalid backend combination for generator");

  return res;
};

const handle_json = async (generator: any, typeDict: any): Promise<any> => {
  const { generate, ...rest } = generator;
  log(8, `Generating JSON API for ${JSON.stringify(rest)}`);

  const source = (typeDict.DatabaseModel || typeDict.ImmutableGlobal)["ex"];

  const promises = [gen_json(generator, source), inject_router(generator)];
  const paths = Promise.all(promises);

  return (await paths).flat();
};

const gen_context = async (generator: any, typeDict: any) => {
  const appName = generator.AppName.toLowerCase();
  const gen = generator.generate;
  const source = (typeDict.DatabaseModel || typeDict.ImmutableGlobal)["ex"];
  return new Promise((resolve, reject) => {
    let command = `mix phx.gen.context ${gen.context} ${gen.schema} ${gen.databaseModel} `;
    command += Object.keys(source)
      .map((k) => `add :${k}, :${source[k]}`)
      .join("\n");
    command = `cd apps/${appName}_web && ${command}; cd ../..`;
    log(2, `Executing: ${command}`);
    exec(command, (err, stdout, stderr) => {
      if (err || stderr) {
        console.error(`Error while generating: ${err || stderr}`);
        reject(null);
      }
      const paths = stdout.match(/(?:\/[^\s]*)+/g) || [];
      resolve(paths);
    });
  });
};

const gen_schema = async (generator: any, typeDict: any) => {
  const appName = generator.AppNameSnake;
  const gen = generator.generate;
  const source = (typeDict.Schema || typeDict.ImmutableGlobal)["ex"];
  return new Promise((resolve, reject) => {
    let command = `mix phx.gen.schema ${gen.schema} ${gen.databaseModel} `;
    command += Object.keys(source)
      .map((k) => `add :${k}, :${source[k]}`)
      .join("\n");
    command = `cd apps/${appName}_web && ${command}; cd ../..`;
    log(2, `Executing: ${command}`);
    exec(command, (err, stdout, stderr) => {
      if (err || stderr) {
        console.error(`Error while generating: ${err || stderr}`);
        reject(null);
      }
      const paths = stdout.match(/(?:\/[^\s]*)+/g) || [];
      resolve(paths);
    });
  });
};

export { handle_phx_gen };
