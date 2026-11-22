import { exec } from "child_process";
import { mkdirSync, rmSync } from "fs";
import { tmpdir, userInfo } from "os";

const isWindows = process.platform === "win32";

const WINGET_IDS: Record<string, string> = {
  git: "Git.Git",
  docker: "Docker.DockerDesktop",
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
