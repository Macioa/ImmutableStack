import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";

import { inject_build_aliases } from "../../injectors/init_react/inject_build_aliases";
import { inject_vite_build_output } from "../../injectors/init_react/inject_vite_build_output";
import { gen_vite_supervisor } from "../../generators/init_phoenix/gen_vite_supervisor";
import { inject_vite_supervisor_to_application_ex } from "../../injectors/init_phoenix/inject_vite_supervisor_to_application_ex";
import { StringOnlyMap } from "../../utils/map";
import { inject_vite_deps } from "../../injectors/init_react/inject_vite_deps";

const init_react_app_with_vite = async ({
  projectName,
  projectNameCamel,
  appdir,
  libdir,
  uidir,
  webdir,
}: StringOnlyMap) => {
  log(
    { level: 2, color: "BLUE" },
    `\nGenerating React app: ${projectName}_ui with vite ...`
  );
  const init = await exec({
    command: `npx create-vite@latest ${projectName}_ui --template react-ts`,
    dir: appdir,
    // options: {
    //   timeoutResolve: 1000 * 30,
    // }
  });

  log(
    { level: 2, color: "BLUE" },
    "\nConfiguring Vite build output and aliases..."
  );

  const tasks = [
    await inject_build_aliases(projectName, uidir),
    await inject_vite_build_output(projectName, uidir),
    await gen_vite_supervisor(projectName, projectNameCamel, libdir),
    await inject_vite_supervisor_to_application_ex(
      projectName,
      projectNameCamel,
      webdir
    ),
  ];

  return tasks.flat();
};

export { init_react_app_with_vite };
