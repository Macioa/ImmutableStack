import { spawn } from "child_process";
import { AppData } from "../../readers/get_app_data";
import { execute } from "../../runners/index";
import { ignoreErrors, resolveShell } from "../../utils/os_adapter";
import { log } from "../../utils/logger";
import { getSetting } from "../../utils/settings";

const GRAPHIFY_PACKAGE = "graphifyy";

// Soft: each step may fail without stopping init
const soft = (command: string) => ignoreErrors(command);

const installGraphifyCommand = () =>
  soft(
    `command -v graphify >/dev/null 2>&1 || uv tool install ${GRAPHIFY_PACKAGE} || pipx install ${GRAPHIFY_PACKAGE} || pip install --user ${GRAPHIFY_PACKAGE}`
  );

const graphifyCommands = () => [
  installGraphifyCommand(),
  soft(`command -v graphify >/dev/null 2>&1 && graphify claude install`),
  soft(`command -v graphify >/dev/null 2>&1 && graphify update .`),
];

// Detached so init finishes while the index builds
const runInBackground = async (dir: string, commands: string[]) => {
  const shell = resolveShell(await getSetting("shell"));
  spawn(commands.join(" ; "), { cwd: dir, shell, detached: true, stdio: "ignore", windowsHide: true }).unref();
  return dir;
};

const init_graphify = async ({ UmbrellaDir }: AppData, { background = false }: { background?: boolean } = {}) => {
  log({ level: 1, color: "BLUE" }, `\n\n Installing graphify and indexing project${background ? " in the background" : ""}...\n\n`);
  if (background) return runInBackground(UmbrellaDir, graphifyCommands());
  return execute(
    {
      dir: UmbrellaDir,
      command: graphifyCommands(),
      options: { resolveOnErrorCode: true },
    },
    "init_graphify"
  );
};

export { init_graphify };
