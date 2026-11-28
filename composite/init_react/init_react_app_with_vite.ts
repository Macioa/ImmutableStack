import path from "path";
import { gen_vite_supervisor } from "../../generators/init_phoenix/gen_vite_supervisor";
import { gen_app_css } from "../../generators/init_react/gen_app_css";
import { gen_index_css } from "../../generators/init_react/gen_index_css";
import { remove_vite_template_assets } from "../../generators/init_react/remove_vite_template_assets";
import { inject_display_font } from "../../injectors/init_react/inject_display_font";
import { gen_app_tsx } from "../../generators/init_react/gen_app_tsx";
import { inject_vite_supervisor_to_application_ex } from "../../injectors/init_phoenix/inject_vite_supervisor_to_application_ex";
import { inject_build_aliases } from "../../injectors/init_react/inject_build_aliases";
import { inject_vite_build_output } from "../../injectors/init_react/inject_vite_build_output";
import { AppData } from "../../readers/get_app_data";
import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";

const CREATE_VITE = "create-vite@9.3.4";

// offline: use the pinned create-vite from the local npx cache when present
const scaffold_react_app_with_vite = async (
  { AppNameSnake, AppDir }: AppData,
  uiName: string = 'ui',
  { offline = false }: { offline?: boolean } = {}
) => {
  log(
    { level: 1, color: "BLUE" },
    `\nGenerating React App: ${AppNameSnake}_${uiName} with Vite ...`
  );
  const npx = offline ? "npx --prefer-offline" : "npx";
  return exec(
    {
      command: `y | ${npx} ${CREATE_VITE} ${AppNameSnake}_${uiName} --template react-ts --no-install`,
      dir: AppDir,
    },
    "init_react_app_with_vite"
  );
};

// scaffold: false when create-vite already ran, e.g. in parallel with phx.new
const init_react_app_with_vite = async (
  appdata: AppData,
  uiName: string = 'ui',
  { scaffold = true, offline = false }: { scaffold?: boolean; offline?: boolean } = {}
) => {
  const init = scaffold ? await scaffold_react_app_with_vite(appdata, uiName, { offline }) : null;

  log(
    { level: 1, color: "BLUE" },
    "\nConfiguring Vite build output and aliases..."
  );

  const tasks = [
    await inject_build_aliases(appdata, uiName),
    await inject_vite_build_output(appdata, uiName),
    await gen_vite_supervisor(appdata, uiName),
    await inject_vite_supervisor_to_application_ex(appdata),
    await gen_app_tsx(appdata, uiName),
    await gen_app_css(appdata, uiName),
    await gen_index_css(appdata, uiName),
    await remove_vite_template_assets(appdata, uiName),
    await inject_display_font(appdata, uiName),
  ];

  return tasks.flat();
};

export { init_react_app_with_vite, scaffold_react_app_with_vite };
