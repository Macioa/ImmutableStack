import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";

const init_react_app_with_createreactapp = async (
  projectName: string,
  appdir: string
) => {
  log(
    { level: 2, color: "BLUE" },
    `\nGenerating React app: ${projectName}_ui with Create-React-App ...`
  );
  return exec({
    command: `npx create-react-app ${projectName}_ui --template typescript`,
    dir: appdir,
  });
};

export { init_react_app_with_createreactapp };
