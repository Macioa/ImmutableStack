import { appendFileSync, existsSync, lstatSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import { AppData } from "../../readers/get_app_data";
import { execute } from "../../runners/index";
import { log } from "../../utils/logger";
import { join } from "../../utils/path";
import { inject_agents_script_package } from "../../injectors/init_agents/inject_agents_script_package";

const SYMLINK_GUIDE = "https://dallay.github.io/agentsync/guides/windows-symlink-setup/";

const agentsync = (version: string, command: string) => `npx -y @dallay/agentsync@${version} ${command}`;

// root links .agents/AGENTS.md back to AGENTS.md for tools that read it from the repo root
const syncedAgents = (agents: string[]) => [...new Set(["root", ...agents])];

const isRegularFile = (file: string) => existsSync(file) && !lstatSync(file).isSymbolicLink();

// Phoenix's AGENTS.md joins the generated rules, so .agents/AGENTS.md is the single source
const mergeRootAgentsMd = (dir: string) => {
  const root = join(dir, "AGENTS.md");
  if (!isRegularFile(root)) return;
  appendFileSync(join(dir, ".agents", "AGENTS.md"), `\n${readFileSync(root, "utf8")}`);
  unlinkSync(root);
};

const withDefaultAgents = (toml: string, agents: string[]) =>
  toml.replace(
    /^source_dir = .*$/m,
    (line) => `${line}\n\n# Agents linked by \`agentsync apply\` (set by immutable -init -agents)\ndefault_agents = [${agents.map((agent) => `"${agent}"`).join(", ")}]`
  );

const setDefaultAgents = (dir: string, agents: string[]) => {
  const file = join(dir, ".agents", "agentsync.toml");
  writeFileSync(file, withDefaultAgents(readFileSync(file, "utf8"), agents));
};

const warnApplyFailed = () =>
  log(
    { level: 1, color: "YELLOW" },
    `\n\nAgentSync could not link the agent files. On Windows, symlinks need Developer Mode or an admin shell: ${SYMLINK_GUIDE}\nThen run \`pnpm run agents\` in the project root.\n\n`
  );

const init_agents = async (appData: AppData, { agents, version }: { agents: string[]; version: string }) => {
  const { UmbrellaDir: dir } = appData;
  const linked = syncedAgents(agents);
  log({ level: 1, color: "BLUE" }, `\n\n Linking agent rules for ${agents.join(", ")} with AgentSync...\n\n`);

  mergeRootAgentsMd(dir);
  await execute({ dir, command: agentsync(version, "init") }, "init_agents");
  setDefaultAgents(dir, linked);
  await inject_agents_script_package(appData, { version });
  return execute({ dir, command: agentsync(version, "apply") }, "init_agents").catch(warnApplyFailed);
};

export { init_agents, syncedAgents, withDefaultAgents };
