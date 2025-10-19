import { AppData } from "../../readers/get_app_data";

const inject_react_deps = async (appdata: AppData, uiName: string = 'ui') => {
  return {
    type: "no_op",
    message: "Dependencies are now managed centrally in apps/package.json"
  };
};

export { inject_react_deps };
