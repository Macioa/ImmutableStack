import { existsSync, readFileSync } from "fs";
import { delimiter, join } from "path";
import { isWindows } from "./os_adapter";

type Versions = Record<string, string>;

const VERSION_LINE = /^\s*(?:export\s+)?([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$/;

const parseLine = (line: string): [string, string][] => {
  const [, key, value] = line.match(VERSION_LINE) || [];
  return key ? [[key, value.replace(/['"]/g, "")]] : [];
};

const parseVersions = (content: string): Versions =>
  Object.fromEntries(content.split(/\r?\n/).flatMap(parseLine));

const readVersions = (dir: string): Versions => {
  const file = join(dir, "versions.sh");
  if (existsSync(file)) return parseVersions(readFileSync(file, "utf8"));
  console.error("versions.sh not found in the same directory.");
  process.exit(1);
};

const pinnedEnv = ({ ERLANG_VERSION, ELIXIR_VERSION, NODE_VERSION }: Versions) => ({
  MISE_ERLANG_VERSION: ERLANG_VERSION,
  MISE_ELIXIR_VERSION: ELIXIR_VERSION,
  MISE_NODE_VERSION: NODE_VERSION,
});

const miseShims = ({ LOCALAPPDATA, HOME, USERPROFILE }: NodeJS.ProcessEnv) =>
  isWindows ? LOCALAPPDATA && join(LOCALAPPDATA, "mise", "shims") : join(HOME || USERPROFILE || "", ".local", "share", "mise", "shims");

// Run commands through the mise shims so pinned versions apply
const miseShimEnv = (env: NodeJS.ProcessEnv) => {
  const shims = miseShims(env);
  return shims ? { PATH: `${shims}${delimiter}${env.PATH}` } : {};
};

const applyPinnedVersions = (dir: string) =>
  Object.assign(process.env, pinnedEnv(readVersions(dir)), miseShimEnv(process.env));

export { applyPinnedVersions, parseVersions, readVersions };
export type { Versions };
