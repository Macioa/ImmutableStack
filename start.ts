import { existsSync, readFileSync } from "fs";
import * as path from "path";
import * as os from "os";
import { log, setLogLevel } from "./utils/logger";
import { execute as exec } from "./runners";
setLogLevel(5);

const isWin = process.platform === "win32";
const home = os.homedir();
const asdfDir = path.join(home, ".asdf");
const asdfShims = path.join(home, ".asdf", "shims");
const env = {
  ...process.env,
  PATH: `${asdfShims}:${process.env.PATH}`,
  ASDF_DIR: asdfDir, 
};

const versionsPath = path.join(__dirname, "versions.sh");

// Homebrew (macOS only)
// if (!isWin) {
//   try {
//     await exec({command: "brew --version", dir: home}, "start_script");
//     log({level: 5, color: "YELLOW"}, "Homebrew is installed.")
//   } catch {
//     log({level: 3, color: "GREEN"}, "Installing Homebrew...")
//     await exec({command: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', dir: home}, "start_script");
//   }
// }
const main = async () => {
  let asdfInstalled = false;
  try {
    await exec(
      { command: isWin ? "where asdf" : "asdf --version", dir: home },
      "start_script"
    );
    asdfInstalled = true;
    log({ level: 5, color: "YELLOW" }, "asdf is installed.");
  } catch {
    if (!isWin) {
      log({ level: 3, color: "GREEN" }, "Installing asdf...");
      await exec({ command: "brew install asdf", dir: home }, "start_script");
      asdfInstalled = true;
    } else {
      console.error(
        "asdf installation on Windows is not automated. Please install asdf manually."
      );
      process.exit(1);
    }
  }

  // Source versions.sh (parse for env vars)
  const versions: Record<string, string> = {};
  if (existsSync(versionsPath)) {
    log({ level: 3, color: "GREEN" }, "Sourcing versions.sh...");
    const lines = readFileSync(versionsPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$/);
      if (match) {
        versions[match[1]] = match[2].replace(/['"]/g, "");
      }
    }
  } else {
    console.error("versions.sh not found in the same directory.");
    process.exit(1);
  }

  // Helper for asdf install
  async function asdfInstall(plugin: string, version: string) {
    try {
      await exec({ command: `asdf list ${plugin}`, dir: home }, "start_script");
      log({ level: 5, color: "YELLOW" }, `${plugin} is already installed.`);
    } catch {
      await exec(
        { command: `asdf plugin-add ${plugin}`, dir: home },
        "start_script"
      );
      await exec(
        { command: `asdf install ${plugin} ${version}`, dir: home },
        "start_script"
      );
      await exec(
        { command: `asdf global ${plugin} ${version}`, dir: home },
        "start_script"
      );
    }
  }

  // Install Erlang, Elixir, Node.js
  if (asdfInstalled) {
    if (versions.erlang) await asdfInstall("erlang", versions.erlang);
    if (versions.elixir) await asdfInstall("elixir", versions.elixir);
    if (versions.nodejs) await asdfInstall("nodejs", versions.nodejs);
  }

  // Install Hex and Phoenix (Elixir)
  log({ level: 3, color: "GREEN" }, "Installing Hex and Phoenix...");
  await exec(
    { command: "mix local.hex --force", dir: home, env },
    "start_script"
  );
  await exec(
    { command: "mix archive.install hex phx_new --force", dir: home },
    "start_script"
  );

  log({ level: 1, color: "GREEN" }, "Setup complete.");
};

main().catch((error) => {
  console.error("Error:", error);
});
