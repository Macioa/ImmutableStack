import { exec, execSync } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import { release, tmpdir, userInfo } from "os";
import { dirname, join, parse } from "path";

type DetectedOS = "windows" | "macos" | "wsl" | "linux" | NodeJS.Platform;
type Environment = { os?: string; shell?: string };

const isWindows = process.platform === "win32";

const GIT_BASH_MISSING =
  "Git Bash not found. Please install Git for Windows: https://git-scm.com/download/win";

const WINGET_IDS: Record<string, string> = {
  git: "Git.Git",
  docker: "Docker.DockerDesktop",
};

// OS and shell detection
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

const detectEnvironment = (): Record<string, string> => {
  const shell = isWindows ? detectGitBash() : null;
  return { os: detectOS(), ...(shell ? { shell } : {}) };
};

// Windows needs a valid Git Bash; elsewhere any saved shell must still exist
const environmentIsStale = ({ os, shell }: Environment) =>
  !os || (isWindows ? !(shell && existsSync(shell)) : !!shell && !existsSync(shell));

const resolveShell = (shell?: string): string | true => {
  if (shell || !isWindows) return shell || true;
  console.error(GIT_BASH_MISSING);
  process.exit(1);
};

// Files and folders
const makeDir = (...dirs: string[]) =>
  dirs.forEach((dir) => mkdirSync(dir, { recursive: true }));

const removePath = (...paths: string[]) =>
  paths.forEach((path) => rmSync(path, { recursive: true, force: true }));

const tempDir = () => tmpdir();

const username = () => userInfo().username;

// Shell fragments. Windows runs these in the Git Bash stored in settings.
const autoYes = (command: string) => `yes | ${command}`;

const ignoreErrors = (command: string) => `${command} 2>/dev/null || true`;

const stopPhoenixServers = () =>
  isWindows
    ? `echo "Skipping server cleanup on Windows"`
    : ignoreErrors(`pkill -f "mix phx.server"`);

// Installers
const installCommand = (name: string, { cask = false } = {}) =>
  isWindows
    ? `winget install --id ${WINGET_IDS[name] || name} -e`
    : `brew install ${cask ? "--cask " : ""}${name}`;

const installPackage = (name: string) => installCommand(name);

const installApp = (name: string) => installCommand(name, { cask: true });

const runPowerShellFile = (file: string) =>
  `powershell -NoProfile -ExecutionPolicy Bypass -File "${file}"`;

const installPrefix = (): Promise<string> =>
  isWindows
    ? Promise.resolve("")
    : new Promise((resolve) =>
        exec("brew --prefix immutable", (_err, stdout) =>
          resolve((stdout || "").trim())
        )
      );

// package.json scripts run in sh on Unix and cmd on Windows, so they use node
const logScript = (message: string) =>
  `node -e \\"console.log('${message}')\\"`;

const linkNodeModulesScript = (typescriptDir: string, target: string) => {
  const to = target.replace(/\\/g, "/");
  const link = `${typescriptDir}/node_modules`;
  return (
    `node -e "const fs=require('fs');` +
    `if(fs.existsSync('${typescriptDir}')){` +
    `fs.rmSync('${link}',{recursive:true,force:true});` +
    `fs.symlinkSync('${to}','${link}','junction');` +
    `console.log('Symlink created: ${link} -> ${to}')` +
    `}else{console.log('Warning: ${typescriptDir} not found, skipping symlink creation')}"`
  );
};

export {
  isWindows,
  detectOS,
  detectGitBash,
  detectEnvironment,
  environmentIsStale,
  resolveShell,
  makeDir,
  removePath,
  tempDir,
  username,
  autoYes,
  ignoreErrors,
  stopPhoenixServers,
  installPackage,
  installApp,
  runPowerShellFile,
  installPrefix,
  logScript,
  linkNodeModulesScript,
};
export type { DetectedOS, Environment };
