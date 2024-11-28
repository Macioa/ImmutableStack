import { writeFileSync } from "fs";
import path from "path";

import {
  StringOnlyMap,
  validate,
  get_in,
  // immutable_set_in as set_in,
  referenced_set_in as set_in,
} from "./map";

type Command = {
  command: string;
  dir: string;
  caller: string;
};
type FileLog = string[];
type FolderLog = {
  [key: string]: FileLog | FolderLog;
};
interface Log {
  _name: string | null;
  commands: Command[];
  file_modifications: FolderLog;
}

let umbrellaDirCache: string | null = null;
const memLog: Log = { _name: null, commands: [], file_modifications: {} };

const cacheLogCommand = (
  {
    command,
    dir,
  }: {
    command: string;
    dir: string;
  },
  caller: string | null = null,
) => {
  memLog.commands.push({ command, dir, caller: caller || "unreferenced" });
};

const cacheLog = (
  { filename, dir }: StringOnlyMap,
  caller: string | null = null,
): Log => {
  validate({ filename, dir }, caller);
  const reducedDir = reduceDir(dir);
  const { file_modifications } = memLog;
  const directories = reducedDir
    .split("/")
    .filter((f) => f)
    .concat([filename]);
  const existingLog = get_in(file_modifications, directories) || [];
  const updatedLog = existingLog.concat([caller || "unreferenced"]);
  set_in(memLog, ["file_modifications", ...directories], updatedLog);
  return memLog;
};

const writeLog = (umbrellaDir: string, name: string) => {
  memLog._name = name;
  const log = JSON.stringify(memLog, null, 2);
  writeFileSync(
    path.resolve(umbrellaDir, `.immutable_history_${name}.json`),
    log,
    "utf8",
  );
};

const cacheLogByPath = (filepath: string, caller: string | null = null) => {
  const paths = filepath.split("/").filter((f) => f);
  const filename = paths.slice(-1)[0];
  const dir = paths.slice(0, -1).join("/");
  return cacheLog({ filename, dir }, caller);
};

const setUmbrellaDirCache = (dir: string) => {
  umbrellaDirCache = path.resolve(dir).replace(/^[^\w]+/, "");
};
const reduceDir = (dir: string) => {
  dir = dir.replace(/^[^\w]+/, "");
  const reducedDir = umbrellaDirCache ? dir.replace(umbrellaDirCache, "") : dir;
  const formattedDir = reducedDir.replace(/^[^\w]+/, "");
  return formattedDir;
};

export {
  cacheLog,
  writeLog,
  cacheLogByPath,
  cacheLogCommand,
  setUmbrellaDirCache,
};
