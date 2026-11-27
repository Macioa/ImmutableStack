import { AppData } from "../../readers/get_app_data";

const inject_package_scripts = async (appdata: AppData, uiName: string = 'ui') => {
  return {
    type: "no_op",
    message: "Package scripts are now managed centrally in apps/package.json"
  };
};

export { inject_package_scripts };
