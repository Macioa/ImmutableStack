import fs from "fs";
import { format } from "../utils/format";
import { cacheLogByPath as cacheLog } from "../utils/history_cache";
import { log } from "../utils/logger";

type Injection = [InjectType, RegExp, string | ((s: string) => string)];

enum InjectType {
  BEFORE = "BEFORE",
  AFTER = "AFTER",
  REPLACE = "REPLACE",
}

type FileInjection = {
  file: string;
  injections: Injection[];
};

const inject_file = async (
  { file, injections }: FileInjection,
  caller: string | null = null
) => {
  try {
    if (!!caller) log({ level: 5, color: "TAN" }, caller);
    log({ level: 5 }, `Injecting into ${file} ...`);

    return new Promise(async (resolve, reject) => {
      cacheLog(file, caller);
      let content = fs.readFileSync(file, "utf8");
      let new_file = content;

      injections.forEach(([type, regex, new_content]: Injection) => {
        log({ level: 7 }, `Injecting ${new_content} into ${file}`);
        log({ level: 9 }, "File: ", new_file);
        switch (type) {
          case InjectType.REPLACE:
            const replaced =
              typeof new_content == "function"
                ? new_content(new_file)
                : new_file.replace(regex, new_content);
            if (!!new_content && (replaced == new_file || replaced == "")) {
              error(regex, file, reject);
              return;
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
  } catch (e) {
    throw new Error(`Error in ${caller}`, { cause: e });
  }
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
  const match = new RegExp(regex.source, regex.flags).exec(content);
  if (!match) return null;
  let index = match.index as number;
  log({ level: 8 }, `Found ${regex} at ${index} in ${file}`);
  if (type === InjectType.AFTER) index += match[0].length;
  else if (type != InjectType.BEFORE) return null;
  return content.slice(0, index) + new_content + content.slice(index);
};

export { inject_file, InjectType };
export type { FileInjection, Injection };
