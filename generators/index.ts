import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve, join } from "path";
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
  caller: string | null = null,
) => {
  cacheLog({ filename, dir }, caller);
  const fileWithSubtext = filename.replace(
    /(.*)\.(\w+)$/,
    (_match, file, extension) => `${file.replace(/\./g, "/")}.${extension}`,
  );
  const path = resolve(dir),
    file = join(dir, fileWithSubtext);
  log({ level: 3 }, `Generating ${fileWithSubtext} ...`);
  log({ level: 9 }, content);

  mkdirSync(path, { recursive: true });
  if (existsSync(file)) unlinkSync(file);
  writeFileSync(file, content, "utf8");
  await format(file);

  return [file];
};

export { generateFile };
export type { FileGeneration };
