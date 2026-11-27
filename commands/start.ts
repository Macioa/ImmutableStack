import * as path from "path";
import * as os from "os";
import { log, setLogLevel } from "@/utils/logger";
import { readSettings } from "@/utils/settings";
import { execute as exec } from "@/runners";
import { installApp, installPackage, isWindows, resolveShell, runPowerShellFile } from "@/utils/os_adapter";
import { asdfEnv, readVersions } from "@/utils/versions";
import type { Versions } from "@/utils/versions";
setLogLevel(5);

const home = os.homedir();
const asdfDir = path.join(home, ".asdf");
const asdfShims = path.join(home, ".asdf", "shims");
const env = {
  ...process.env,
  PATH: `${asdfShims}:${process.env.PATH}`,
  ASDF_DIR: asdfDir,
};

// Homebrew (macOS only)
// if (!isWindows) {
//   try {
//     await exec({command: "brew --version", dir: home}, "start_script");
//     log({level: 5, color: "YELLOW"}, "Homebrew is installed.")
//   } catch {
//     log({level: 3, color: "GREEN"}, "Installing Homebrew...")
//     await exec({command: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', dir: home}, "start_script");
//   }
// }
const run = (command: string, runEnv?: NodeJS.ProcessEnv) =>
  exec({ command, dir: home, env: runEnv }, "start_script");

const runInOrder = (commands: string[], runEnv?: NodeJS.ProcessEnv) =>
  commands.reduce<Promise<unknown>>(
    (previous, command) => previous.then(() => run(command, runEnv)),
    Promise.resolve()
  );

type EnsureOptions = {
  check: string;
  install: string[];
  found: string;
  installing?: string;
  installed?: string;
};

const ensureInstalled = async ({ check, install, found, installing, installed }: EnsureOptions) => {
  try {
    await run(check);
    log({ level: 5, color: "YELLOW" }, found);
  } catch {
    if (installing) log({ level: 3, color: "GREEN" }, installing);
    await runInOrder(install);
    if (installed) log({ level: 3, color: "GREEN" }, installed);
  }
};

// Reading settings resyncs a missing OS or shell
const storeEnvironment = async () => {
  const { os: detected, shell } = await readSettings();
  log({ level: 3, color: "GREEN" }, `Detected OS: ${detected}`);
  if (isWindows) log({ level: 3, color: "GREEN" }, `Detected Git Bash: ${resolveShell(shell)}`);
};

const ensureAsdf = () =>
  ensureInstalled({
    check: "asdf --version",
    install: [installPackage("asdf")],
    found: "asdf is installed.",
    installing: "Installing asdf...",
  });

const ensureAsdfTool = ([plugin, version]: [string, string]) =>
  ensureInstalled({
    check: `asdf list ${plugin}`,
    install: [
      `asdf plugin list | grep -qx ${plugin} || asdf plugin add ${plugin}`,
      `asdf install ${plugin} ${version}`,
      `asdf set -u ${plugin} ${version}`,
    ],
    found: `${plugin} is already installed.`,
  });

const ensureAsdfTools = ({ ERLANG_VERSION, ELIXIR_VERSION, NODE_VERSION }: Versions) =>
  ([["erlang", ERLANG_VERSION], ["elixir", ELIXIR_VERSION], ["nodejs", NODE_VERSION]] as [string, string][])
    .reduce<Promise<unknown>>(
      (previous, tool) => previous.then(() => ensureAsdfTool(tool)),
      Promise.resolve()
    );

const ensureDocker = () =>
  ensureInstalled({
    check: "docker --version",
    install: [installApp("docker")],
    found: "Docker is installed.",
    installing: "Installing Docker...",
    installed: "Docker installed. Please launch Docker Desktop manually if required.",
  });

const installPhoenix = (versions: Versions) => {
  log({ level: 3, color: "GREEN" }, "Installing Hex and Phoenix...");
  return runInOrder(
    ["mix local.hex --force", "mix archive.install hex phx_new 1.8.17 --force"],
    { ...env, ...asdfEnv(versions) }
  );
};

const ensurePnpm = () =>
  ensureInstalled({
    check: "pnpm --version",
    install: ["npm install -g pnpm"],
    found: "pnpm is installed.",
    installing: "Installing pnpm...",
  });

// Windows uses mise instead of asdf
const setupWindows = () =>
  run(runPowerShellFile(path.join(__dirname, "start_windows.ps1")));

const setupUnix = async () => {
  await ensureAsdf();
  log({ level: 3, color: "GREEN" }, "Sourcing versions.sh...");
  const versions = readVersions(__dirname);
  await ensureAsdfTools(versions);
  await ensureDocker();
  await ensurePnpm();
  await installPhoenix(versions);
  log({ level: 1, color: "GREEN" }, "Setup complete.");
};

const main = async () => {
  await storeEnvironment();
  return isWindows ? setupWindows() : setupUnix();
};

main().catch((error) => {
  console.error("Error:", error);
});
