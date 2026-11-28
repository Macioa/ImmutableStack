import { join } from "../../utils/path";
import { inject_file, Injection, InjectType } from "../../injectors/index";
import { AppData } from "../../readers/get_app_data";

// `pnpm run agents` relinks .agents/AGENTS.md after a clone, since the links are gitignored
const agentsyncCommand = (version: string) => `npx -y @dallay/agentsync@${version} apply`;

const inject_agents_script_package = ({ UmbrellaDir }: AppData, { version }: { version: string }) => {
  const file = join(UmbrellaDir || "", "package.json");
  const injections: Injection[] = [
    [InjectType.AFTER, /"scripts"\s*:\s\{/g, `\n    "agents": "${agentsyncCommand(version)}",`],
  ];
  return inject_file({ file, injections }, "inject_agents_script_package");
};

export { agentsyncCommand, inject_agents_script_package };
