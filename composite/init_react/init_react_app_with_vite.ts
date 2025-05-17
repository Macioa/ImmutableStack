import { gen_vite_supervisor } from "../../generators/init_phoenix/gen_vite_supervisor";
import { inject_vite_supervisor_to_application_ex } from "../../injectors/init_phoenix/inject_vite_supervisor_to_application_ex";
import { inject_build_aliases } from "../../injectors/init_react/inject_build_aliases";
import { inject_vite_build_output } from "../../injectors/init_react/inject_vite_build_output";
import { AppData } from "../../readers/get_app_data";
import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";

const init_react_app_with_vite = async (appdata: AppData) => {
  const { AppNameSnake, AppDir } = appdata;
  log(
    { level: 1, color: "BLUE" },
    `\nGenerating React App: ${AppNameSnake}_ui with Vite ...`
  );
  const init = await exec(
    {
      command: `y | npx create-vite@6.5.0 ${AppNameSnake}_ui --template react-ts --no-install`,
      dir: AppDir,
      // options: {
      //   timeoutResolve: 1000 * 30,
      // }
    },
    "init_react_app_with_vite"
  );

  log(
    { level: 1, color: "BLUE" },
    "\nConfiguring Vite build output and aliases..."
  );

  const tasks = [
    await inject_build_aliases(appdata),
    await inject_vite_build_output(appdata),
    await gen_vite_supervisor(appdata),
    await inject_vite_supervisor_to_application_ex(appdata),
  ];

  return tasks.flat();
};

export { init_react_app_with_vite };
