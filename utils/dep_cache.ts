/*
** Dependency Cache **
    Shares one dependency cache across initialized projects
      - Phoenix: deps is linked into the cache, existing ones are reused
      - compiled deps: built once per Elixir/OTP version, kept in the cache and copied into
        each project's _build; the project's own apps compile locally and are never shared
      - React: pnpm keeps one store in the cache and links packages into node_modules,
        apps/pnpm-workspace.yaml points the store at the cache with preferOffline
      - covers sqlite: ecto_sqlite3/exqlite (and its NIF) are cached like any dep
      - assets: fetch_assets keeps downloaded UI assets in <cache>/assets
*/
import { execSync } from "child_process";
import { appendFileSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { AppData } from "@/readers/get_app_data";
import { log } from "@/utils/logger";

const DEFAULT_CACHE_DIR = join(homedir(), ".immutable_dep_cache");

const VERSION_PATTERN = /Elixir ([\d.]+) \(compiled with Erlang\/OTP (\d+)\)/;

const toolchainKey = () => {
  try {
    const [, elixir, otp] = execSync("elixir --version", { encoding: "utf8" }).match(VERSION_PATTERN) || [];
    return elixir ? `elixir-${elixir}-otp${otp}` : "elixir-unknown";
  } catch {
    return "elixir-unknown";
  }
};

// Phoenix dependency folders and their cache subfolders
const mixLinks = ({ UmbrellaDir }: AppData) => [
  { link: join(UmbrellaDir, "deps"), target: "mix_deps" },
];

// Compiled deps are copied, not linked: Mix replaces linked dep builds, and sharing a whole
// _build would also share the project's own apps between projects with the same name
const projectBuildDir = (UmbrellaDir: string) => join(UmbrellaDir, "_build", "dev", "lib");
const cacheBuildDir = (cacheDir: string) => join(cacheDir, "mix_build", toolchainKey(), "dev", "lib");
const depNames = (UmbrellaDir: string) => readdirSync(join(UmbrellaDir, "deps"));

// dereference: dep builds can link priv to the project's deps folder
const copyBuilds = (fromDir: string, toDir: string, names: string[]) =>
  names
    .filter((name) => existsSync(join(fromDir, name)) && !existsSync(join(toDir, name)))
    .map((name) => {
      cpSync(join(fromDir, name), join(toDir, name), { recursive: true, dereference: true });
      return name;
    });

const isLinked = (path: string) => existsSync(path) && lstatSync(path).isSymbolicLink();

// Junctions need no admin rights on Windows and act as plain dir symlinks elsewhere
const linkDir = (target: string, link: string) => {
  mkdirSync(target, { recursive: true });
  if (isLinked(link)) return;
  rmSync(link, { recursive: true, force: true });
  symlinkSync(target, link, "junction");
};

const pnpmSettings = (cacheDir: string) =>
  `storeDir: ${join(cacheDir, "pnpm_store").replace(/\\/g, "/")}\npreferOffline: true\n`;

const link_dep_cache = (appData: AppData, { cacheDir = DEFAULT_CACHE_DIR }: { cacheDir?: string } = {}) => {
  log({ level: 1, color: "BLUE" }, `\n Linking dependencies to cache: ${cacheDir}\n`);
  mixLinks(appData).forEach(({ link, target }) => linkDir(join(cacheDir, target), link));
  appendFileSync(join(appData.AppDir, "pnpm-workspace.yaml"), pnpmSettings(cacheDir));
};

// Copies cached dep builds into the project; returns deps the cache does not have yet
const seed_build_cache = ({ UmbrellaDir }: AppData, { cacheDir = DEFAULT_CACHE_DIR }: { cacheDir?: string } = {}) => {
  const deps = depNames(UmbrellaDir);
  copyBuilds(cacheBuildDir(cacheDir), projectBuildDir(UmbrellaDir), deps);
  return deps.filter((dep) => !existsSync(join(projectBuildDir(UmbrellaDir), dep)));
};

// Saves the project's compiled deps to the cache for the next project
const save_build_cache = ({ UmbrellaDir }: AppData, { cacheDir = DEFAULT_CACHE_DIR }: { cacheDir?: string } = {}) => {
  mkdirSync(cacheBuildDir(cacheDir), { recursive: true });
  return copyBuilds(projectBuildDir(UmbrellaDir), cacheBuildDir(cacheDir), depNames(UmbrellaDir));
};

// Projects initialized with -cache have deps linked into the cache
const uses_dep_cache = ({ UmbrellaDir }: AppData) => isLinked(join(UmbrellaDir, "deps"));

export { link_dep_cache, seed_build_cache, save_build_cache, uses_dep_cache, DEFAULT_CACHE_DIR };
