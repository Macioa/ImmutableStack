import { mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";
import { log } from "../utils/logger";
import { format } from "../utils/format";

type FileGeneration = {
  dir: string;
  filename: string;
  content: string;
};

const generateFile = async ({ filename, dir, content }: FileGeneration) => {
  const path = resolve(dir),
    file = join(dir, filename);
  log({ level: 3 }, `Generating ${filename} ...`);
  log({ level: 9 }, content);

  mkdirSync(path, { recursive: true });
  writeFileSync(file, content, "utf8");
  await format(file);
  return [file];
};

export { generateFile };
export type { FileGeneration };
