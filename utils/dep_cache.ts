/*
** Dependency Cache **
    Shares one dependency cache across initialized projects
      - Phoenix: deps and _build are linked into the cache, existing ones are reused
      - _build is keyed by Elixir/OTP version so toolchains never share binaries
      - React: pnpm keeps one store in the cache and links packages into node_modules,
        apps/pnpm-workspace.yaml points the store at the cache with preferOffline
      - covers sqlite: ecto_sqlite3/exqlite (and its NIF) are cached like any dep
*/
import { execSync } from "child_process";
import { appendFileSync, existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from "fs";
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
  { link: join(UmbrellaDir, "_build"), target: join("mix_build", toolchainKey()) },
];

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

export { link_dep_cache, DEFAULT_CACHE_DIR };
