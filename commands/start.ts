import * as path from "path";
import * as os from "os";
import { log, setLogLevel } from "@/utils/logger";
import { readSettings } from "@/utils/settings";
import { execute as exec } from "@/runners";
import { installApp, isWindows, resolveShell, runPowerShellFile } from "@/utils/os_adapter";
import { readVersions } from "@/utils/versions";
import type { Versions } from "@/utils/versions";
setLogLevel(5);

const home = os.homedir();
const miseBin = path.join(home, ".local", "bin");
const miseShims = path.join(home, ".local", "share", "mise", "shims");
const env = {
  ...process.env,
  PATH: `${miseBin}:${miseShims}:${process.env.PATH}`,
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
const run = (command: string, runEnv: NodeJS.ProcessEnv = env) =>
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

// The pinned mise goes in ~/.local/bin, ahead of any other mise on PATH
const miseIs = (version: string) => `mise --version | grep -qF "${version}"`;

const ensureMise = ({ MISE_VERSION }: Versions) =>
  ensureInstalled({
    check: miseIs(MISE_VERSION),
    install: [
      `curl -fsSL https://mise.run | MISE_VERSION="v${MISE_VERSION}" MISE_INSTALL_PATH="${path.join(miseBin, "mise")}" sh`,
      miseIs(MISE_VERSION),
    ],
    found: `mise ${MISE_VERSION} is installed.`,
    installing: `Installing mise ${MISE_VERSION}...`,
  });

// mise uses precompiled Erlang and Elixir where available
const ensureMiseTool = ([tool, version]: [string, string]) =>
  ensureInstalled({
    check: `mise where ${tool}@${version}`,
    install: [`mise use --global ${tool}@${version}`],
    found: `${tool} ${version} is already installed.`,
    installing: `Installing ${tool} ${version}...`,
  });

const ensureMiseTools = ({ ERLANG_VERSION, ELIXIR_VERSION, NODE_VERSION }: Versions) =>
  ([["erlang", ERLANG_VERSION], ["elixir", ELIXIR_VERSION], ["node", NODE_VERSION]] as [string, string][])
    .reduce<Promise<unknown>>(
      (previous, tool) => previous.then(() => ensureMiseTool(tool)),
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
    ["mix local.hex --force", "mix local.rebar --force", `mix archive.install hex phx_new ${versions.PHOENIX_VERSION} --force`]
  );
};

const ensurePnpm = () =>
  ensureInstalled({
    check: "pnpm --version",
    install: ["npm install -g pnpm"],
    found: "pnpm is installed.",
    installing: "Installing pnpm...",
  });

// Windows installs mise through winget in PowerShell
const setupWindows = () =>
  run(runPowerShellFile(path.join(__dirname, "start_windows.ps1")), process.env);

const setupUnix = async () => {
  log({ level: 3, color: "GREEN" }, "Sourcing versions.sh...");
  const versions = readVersions(__dirname);
  await ensureMise(versions);
  await ensureMiseTools(versions);
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
