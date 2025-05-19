import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve, join } from "../utils/path";
import { log } from "../utils/logger";
import { format } from "../utils/format";

import { cacheLog } from "../utils/history_cache";

type FileGeneration = {
  dir: string;
  filename: string;
  content: string;
};

const generateFile = async (
  { filename, dir, content }: FileGeneration,
  caller: string | null = null
) => {
  try {
    cacheLog({ filename, dir }, caller);
    const path = resolve(dir),
      file = join(dir, filename);
    if (!!caller) log({ level: 5, color: "TAN" }, caller);
    log({ level: 5 }, `Generating ${filename} ...`);
    log({ level: 9 }, content);

    mkdirSync(path, { recursive: true });
    if (existsSync(file)) unlinkSync(file);
    writeFileSync(file, content, "utf8");
    await format(file);

    return [file];
  } catch (e) {
    throw new Error(`Error in ${caller}`, { cause: e });
  }
};

export { generateFile };
export type { FileGeneration };
