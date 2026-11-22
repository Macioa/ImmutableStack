import { execSync } from "child_process";
import { existsSync } from "fs";
import { release } from "os";
import { dirname, join, parse } from "path";

type DetectedOS = "windows" | "macos" | "wsl" | "linux" | NodeJS.Platform;

const detectOS = (): DetectedOS => {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    case "linux":
      return /microsoft|wsl/i.test(release()) ? "wsl" : "linux";
    default:
      return process.platform;
  }
};

const ancestorDirs = (dir: string): string[] =>
  dir === parse(dir).root ? [] : [dir, ...ancestorDirs(dirname(dir))];

// Git can be in Git\cmd, Git\bin, or Git\mingw64\bin
const bashPathsFromGit = (gitPath: string) =>
  ancestorDirs(dirname(gitPath)).map((dir) => join(dir, "bin", "bash.exe"));

const gitPaths = () => {
  try {
    return execSync("where git", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    return [];
  }
};

const installedBashPaths = () => {
  const { ProgramW6432, ProgramFiles, LOCALAPPDATA } = process.env;
  return [
    ProgramW6432,
    ProgramFiles,
    process.env["ProgramFiles(x86)"],
    LOCALAPPDATA && join(LOCALAPPDATA, "Programs"),
  ]
    .filter((dir): dir is string => !!dir)
    .map((dir) => join(dir, "Git", "bin", "bash.exe"));
};

const firstExisting = (paths: string[]) =>
  paths.find((path) => existsSync(path));

// Never searches PATH for bash: System32\bash.exe is the WSL launcher
const detectGitBash = (): string | null =>
  firstExisting(installedBashPaths()) ??
  firstExisting(gitPaths().flatMap(bashPathsFromGit)) ??
  null;

export { detectOS, detectGitBash };
export type { DetectedOS };
