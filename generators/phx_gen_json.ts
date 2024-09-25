import { exec } from 'child_process';
import { log } from '../utils/logger'; // Assuming you have a logger module

const gen_json = async (generator: any, source: any) => {
    const gen = generator.generate;
    return new Promise((resolve, reject) => {
      let command =
        `mix phx.gen.json ${gen.context} ${gen.schema} ${gen.databaseModel}` +
        Object.keys(source)
          .map((k) => ` ${k}:${source[k]}`)
          .join("") +
        " --no-prompts";
  
      log(1, `Executing: ${command}`);
      exec(`cd ${generator.WebDir} && ${command}`, (err, stdout, stderr) => {
        log(8, stdout);
        setTimeout(()=>{
          log(6,`Phx Gen ... \n${err || stderr || stdout}`);
          reject(null)
        }, 5000)
        if (err || stderr) {
          console.error(`Error while generating: ${err || stderr}`);
          reject(null);
        }
        const paths = stdout.match(/(?:\/[^\s]*)+/g) || [];
        log(4, "Created: ", paths);
        resolve(paths);
      });
    });
  };

  export { gen_json };