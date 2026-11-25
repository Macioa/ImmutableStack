import { AppData } from "../../readers/get_app_data";
import { execute } from "../../runners/index";
import { ignoreErrors } from "../../utils/os_adapter";
import { log } from "../../utils/logger";

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

const init_graphify = async ({ UmbrellaDir }: AppData) => {
  log({ level: 1, color: "BLUE" }, `\n\n Installing graphify and indexing project...\n\n`);
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
