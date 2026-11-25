/*
** Dependency Cache **
    Links a project's dependency and build folders to a shared cache folder
      - downloads and compiled deps land in the cache, existing ones are reused
      - _build is keyed by Elixir/OTP version so toolchains never share binaries
      - covers sqlite: ecto_sqlite3/exqlite (and its NIF) are cached like any dep
*/
import { execSync } from "child_process";
import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { AppData } from "@/readers/get_app_data";
import { log } from "@/utils/logger";

const DEFAULT_CACHE_DIR = join(homedir(), ".immutable", "dep_cache");

const TOOLCHAIN_SCRIPT = `IO.write(System.version() <> "-otp" <> System.otp_release())`;

const toolchainKey = () => {
  try {
    return `elixir-${execSync(`elixir -e '${TOOLCHAIN_SCRIPT}'`, { encoding: "utf8" }).trim()}`;
  } catch {
    return "elixir-unknown";
  }
};

// Project dependency folders and their cache subfolders
const depLinks = ({ UmbrellaDir, AppDir }: AppData) => [
  { link: join(UmbrellaDir, "deps"), target: "mix_deps" },
  { link: join(UmbrellaDir, "_build"), target: join("mix_build", toolchainKey()) },
  { link: join(AppDir, "node_modules"), target: "node_modules" },
];

const isLinked = (path: string) => existsSync(path) && lstatSync(path).isSymbolicLink();

// Junctions need no admin rights on Windows and act as plain dir symlinks elsewhere
const linkDir = (target: string, link: string) => {
  mkdirSync(target, { recursive: true });
  if (isLinked(link)) return;
  rmSync(link, { recursive: true, force: true });
  symlinkSync(target, link, "junction");
};

const link_dep_cache = (appData: AppData, cacheDir: string = DEFAULT_CACHE_DIR) => {
  log({ level: 1, color: "BLUE" }, `\n Linking dependencies to cache: ${cacheDir}\n`);
  depLinks(appData).forEach(({ link, target }) => linkDir(join(cacheDir, target), link));
};

export { link_dep_cache, DEFAULT_CACHE_DIR };
