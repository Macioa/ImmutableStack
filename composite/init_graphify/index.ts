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

// AgentSync agent ids whose graphify installer has another name
const GRAPHIFY_PLATFORMS: Record<string, string> = { copilot: "vscode" };

// graphify writes its rules and hooks for each agent; the rules go through AgentSync's links into .agents/AGENTS.md
const graphifyInstall = (agent: string) =>
  soft(`command -v graphify >/dev/null 2>&1 && graphify ${GRAPHIFY_PLATFORMS[agent] || agent} install`);

const graphifyCommands = (agents: string[]) => [
  installGraphifyCommand(),
  ...agents.map(graphifyInstall),
  soft(`command -v graphify >/dev/null 2>&1 && graphify update .`),
];

// Detached so init finishes while the index builds
const runInBackground = async (dir: string, commands: string[]) => {
  const shell = resolveShell(await getSetting("shell"));
  spawn(commands.join(" ; "), { cwd: dir, shell, detached: true, stdio: "ignore", windowsHide: true }).unref();
  return dir;
};

const init_graphify = async (
  { UmbrellaDir }: AppData,
  { background = false, agents = ["claude"] }: { background?: boolean; agents?: string[] } = {}
) => {
  log({ level: 1, color: "BLUE" }, `\n\n Installing graphify and indexing project${background ? " in the background" : ""}...\n\n`);
  if (background) return runInBackground(UmbrellaDir, graphifyCommands(agents));
  return execute(
    {
      dir: UmbrellaDir,
      command: graphifyCommands(agents),
      options: { resolveOnErrorCode: true },
    },
    "init_graphify"
  );
};

export { init_graphify };
