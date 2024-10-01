import { mkdirSync, writeFile } from "fs";
import { resolve, join } from "path";
import { log } from "../utils/logger";

type FileGeneration = {
  dir: string;
  filename: string;
  content: string;
};

const generateFile = async ({ filename, dir, content }: FileGeneration) => {
  const path = resolve(dir),
    file = join(dir, filename);
  log(3, `Generating ${filename} ...`);
  log(9, content);
  return new Promise((resolve, reject) => {
    mkdirSync(path, { recursive: true });
    writeFile(file, content, "utf8", (err: any) =>
      err ? reject(err) : resolve([file])
    );
  });
};

export { generateFile }
export type { FileGeneration }
