import fs from "fs";
import { execSync } from "child_process";
import { log } from "../utils/logger";
import { format } from "../utils/format";

type Injection = [InjectType, RegExp, string];

enum InjectType {
  BEFORE = "BEFORE",
  AFTER = "AFTER",
  REPLACE = "REPLACE",
}

type FileInjection = {
  file: string;
  injections: Injection[];
};

const inject_file = async ({ file, injections }: FileInjection) => {
  log({ level: 5 }, `Injecting into ${file}....`);

  return new Promise(async (resolve, reject) => {
    let content = fs.readFileSync(file, "utf8");
    let new_file = content;

    injections.forEach(([type, regex, new_content]: Injection) => {
      log({ level: 7 }, `Injecting ${new_content} into ${file}`);
      log({ level: 9 }, "File: ", new_file);
      switch (type) {
        case InjectType.REPLACE:
          const replaced = new_file.replace(regex, new_content);
          if (replaced == new_file || replaced == ""){ 
            error(regex, file, reject);
            return 
          } else {
            log({ level: 8 }, `Found ${regex} in ${file}`);
            new_file = replaced;
          }
          break;
        default:
          new_file =
            insert(new_file, file, [type, regex, new_content]) ||
            error(regex, file, reject);
      }
    });

    if (new_file.length) {
      fs.writeFileSync(file, new_file, "utf8");
    await format(file);
    resolve([file]);
    } else reject(new Error(`Insertion failed for ${file}`));
  });
};

const error = (regex: RegExp, file: string, reject: Function) => {
  console.error(`${regex} not found in the ${file} file.`);
  reject(new Error(`Insertion failed for ${file}`));
  return "";
};

const insert = (
  content: string,
  file: string,
  [type, regex, new_content]: Injection
) => {
  const match = content.match(regex);
  if (!match) return null;
  let index = match.index as number;
  log({ level: 8 }, `Found ${regex} at ${index} in ${file}`);
  if (type === InjectType.AFTER) index += match[0].length;
  else if (type != InjectType.BEFORE) return null;
  return content.slice(0, index) + new_content + content.slice(index);
};

export { inject_file, InjectType };
export type { Injection, FileInjection };
