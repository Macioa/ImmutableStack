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

const asdfEnv = ({ ERLANG_VERSION, ELIXIR_VERSION }: Versions) => ({
  ASDF_ERLANG_VERSION: ERLANG_VERSION,
  ASDF_ELIXIR_VERSION: ELIXIR_VERSION,
});

const pinnedEnv = (versions: Versions) => {
  const { ERLANG_VERSION, ELIXIR_VERSION, NODE_VERSION } = versions;
  return {
    ...asdfEnv(versions),
    ASDF_NODEJS_VERSION: NODE_VERSION,
    MISE_ERLANG_VERSION: ERLANG_VERSION,
    MISE_ELIXIR_VERSION: ELIXIR_VERSION,
    MISE_NODE_VERSION: NODE_VERSION,
  };
};

// Windows: run commands through the mise shims so pinned versions apply
const miseShimEnv = ({ LOCALAPPDATA, PATH }: NodeJS.ProcessEnv) =>
  isWindows && LOCALAPPDATA
    ? { PATH: `${join(LOCALAPPDATA, "mise", "shims")}${delimiter}${PATH}` }
    : {};

const applyPinnedVersions = (dir: string) =>
  Object.assign(process.env, pinnedEnv(readVersions(dir)), miseShimEnv(process.env));

export { applyPinnedVersions, asdfEnv, parseVersions, readVersions };
export type { Versions };
