/*
** Init Deps **
    Installs Phoenix and React dependencies in parallel
      - offline: hex resolves from its local registry cache first, then falls back online
*/
import { AppData } from "../../readers/get_app_data";
import { execute } from "../../runners/index";
import { log } from "../../utils/logger";

// The deps.get alias also installs UI deps, which run separately here
const mixEnv = (offline: boolean) => ({
  ...process.env,
  SKIP_UI_INSTALL: "1",
  ...(offline ? { HEX_OFFLINE: "1" } : {}),
});

const mixDepsGet = ({ UmbrellaDir }: AppData, offline: boolean) =>
  execute({ command: "mix deps.get", dir: UmbrellaDir, env: mixEnv(offline) }, "init_deps");

const install_mix_deps = async (appData: AppData, { offline = false }: { offline?: boolean } = {}) =>
  offline
    ? mixDepsGet(appData, true).catch(() => mixDepsGet(appData, false))
    : mixDepsGet(appData, false);

const install_ui_deps = async ({ AppDir }: AppData) =>
  execute({ command: "pnpm install", dir: AppDir }, "init_deps");

const install_all_deps = async (appData: AppData, { offline = false }: { offline?: boolean } = {}) => {
  log({ level: 1, color: "BLUE" }, `\n\n Retrieving dependencies for React and Phoenix...\n\n`);
  return Promise.all([install_mix_deps(appData, { offline }), install_ui_deps(appData)]);
};

export { install_all_deps, install_mix_deps, install_ui_deps };
