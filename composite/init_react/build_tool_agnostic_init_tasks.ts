import { gen_lorem_utils } from "../../generators/init_react/gen_lorem_utils";
import { gen_request_lib } from "../../generators/init_react/gen_request_lib";
import { gen_store } from "../../generators/init_react/gen_store";
import { inject_redux_provider } from "../../injectors/init_react/inject_redux_provider";
import { inject_package_scripts } from "../../injectors/init_react/inject_package_scripts";
import { inject_react_deps } from "../../injectors/init_react/inject_react_deps";
import {
  gen_jest_config,
  gen_jest_setup,
} from "../../generators/init_react/gen_jest_configs";
import { gen_socket_context } from "../../generators/init_react/gen_socket_context";
import { AppData } from "../../readers/get_app_data";

const build_tool_agnostic_init_tasks = async (appdata: AppData) => {
  const tasks = await Promise.all([
    gen_store(appdata),
    inject_redux_provider(appdata),
    gen_lorem_utils(appdata),
    gen_request_lib(appdata),
    inject_package_scripts(appdata),
    inject_react_deps(appdata),
    gen_jest_config(appdata),
    gen_jest_setup(appdata),
    gen_socket_context(appdata),
  ]).catch(console.error);

  return [tasks].flat();
};

export { build_tool_agnostic_init_tasks };
