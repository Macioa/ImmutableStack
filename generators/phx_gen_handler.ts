import { exec } from "child_process";
import { log } from "../utils/logger"

const handle_phx_gen = async (generator: any, typeDict: any) => {
  const gen = generator.generate;
  let res = null;
  if (gen.http_controller && gen.context && gen.schema && gen.databaseModel)
    res = await gen_json(generator, typeDict);
  else if (gen.context && gen.schema && gen.databaseModel) res = await gen_context(generator, typeDict);
  else if (gen.schema && gen.databaseModel) res = await gen_schema(generator, typeDict)
  else console.log("Invalid backend combination for generator");

  return res;
};

const gen_json = async (generator: any, typeDict: any):Promise<string[] | null> => {
  const appName = generator.AppName.replace(/([A-Z])/g, '_$1').toLowerCase().slice(1)
  const gen = generator.generate;
  const source = (typeDict.DatabaseModel || typeDict.ImmutableGlobal)["ex"];
  return new Promise((resolve, reject) => {
    let command = `mix phx.gen.json ${gen.context} ${gen.schema} ${gen.databaseModel}`;
    command += Object.keys(source)
      .map((k) => ` ${k}:${source[k]}`)
      .join("") + " --no-prompts"
    command = `cd apps/${appName}_web && ${command}; cd ../..`
    log(1, `Executing: ${command}`);
    exec(command, (err, stdout, stderr) => {
      log(8, stdout)
      if (err || stderr) {
        console.error(`Error while generating: ${err || stderr}`);
        reject(null);
      }
      const paths = stdout.match(/(?:\/[^\s]*)+/g) || []
      log(4, "Created: ", paths)
      resolve(paths);
    });
  });
};

const gen_context = async (generator: any, typeDict: any) => {
    const appName = generator.AppName.toLowerCase()
    const gen = generator.generate;
    const source = (typeDict.DatabaseModel || typeDict.ImmutableGlobal)["ex"];
    return new Promise((resolve, reject) => {
      let command = `mix phx.gen.context ${gen.context} ${gen.schema} ${gen.databaseModel} `;
      command += Object.keys(source)
        .map((k) => `add :${k}, :${source[k]}`)
        .join("\n");
      command = `cd apps/${appName}_web && ${command}; cd ../..`
      console.log(`Executing: ${command}`);
      exec(command, (err, stdout, stderr) => {
        if (err || stderr) {
          console.error(`Error while generating: ${err || stderr}`);
          reject(null);
        }
        const paths = stdout.match(/(?:\/[^\s]*)+/g) || []
        resolve(paths);
      });
    });
}

const gen_schema = async (generator: any, typeDict: any) => {
    const appName = generator.AppName.toLowerCase()
    const gen = generator.generate;
    const source = (typeDict.Schema || typeDict.ImmutableGlobal)["ex"];
    return new Promise((resolve, reject) => {
      let command = `mix phx.gen.schema ${gen.schema} ${gen.databaseModel} `;
      command += Object.keys(source)
        .map((k) => `add :${k}, :${source[k]}`)
        .join("\n");
      command = `cd apps/${appName}_web && ${command}; cd ../..`
      console.log(`Executing: ${command}`);
      exec(command, (err, stdout, stderr) => {
        if (err || stderr) {
          console.error(`Error while generating: ${err || stderr}`);
          reject(null);
        }
        const paths = stdout.match(/(?:\/[^\s]*)+/g) || []
        resolve(paths);
      });
    });
}

export { handle_phx_gen };