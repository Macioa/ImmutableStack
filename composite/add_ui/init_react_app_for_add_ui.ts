import path from "path";
import { gen_app_css } from "../../generators/init_react/gen_app_css";
import { gen_app_tsx } from "../../generators/init_react/gen_app_tsx";
import { inject_build_aliases } from "../../injectors/init_react/inject_build_aliases";
import { inject_vite_build_output } from "../../injectors/init_react/inject_vite_build_output";
import { AppData } from "../../readers/get_app_data";
import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";

const init_react_app_for_add_ui = async (appdata: AppData, uiName: string = 'ui') => {
  const { AppNameSnake, AppDir } = appdata;
  log(
    { level: 1, color: "BLUE" },
    `\nGenerating React App: ${AppNameSnake}_${uiName} with Vite ...`
  );
  const init = await exec(
    {
      command: `y | npx create-vite@6.5.0 ${AppNameSnake}_${uiName} --template react-ts --no-install`,
      dir: AppDir,
      // options: {
      //   timeoutResolve: 1000 * 30,
      // }
    },
    "init_react_app_for_add_ui"
  );

  log(
    { level: 1, color: "BLUE" },
    "\nConfiguring Vite build output and aliases..."
  );

  const tasks = [
    await inject_build_aliases(appdata, uiName),
    await inject_vite_build_output(appdata, uiName),
    await gen_app_tsx(appdata, uiName),
    await gen_app_css(appdata, uiName),
  ];

  return tasks.flat();
};

export { init_react_app_for_add_ui };
