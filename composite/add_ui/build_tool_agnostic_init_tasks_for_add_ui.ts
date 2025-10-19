import { gen_demo_component_styles } from "../../generators/gen_react/demo_components/gen_demo_component_styles";
import { gen_index_html } from "../../generators/init_react/gen_index.html";
import {
  gen_jest_config,
  gen_jest_setup,
} from "../../generators/init_react/gen_jest_configs";
import { gen_lorem_utils } from "../../generators/init_react/gen_lorem_utils";
import { gen_request_lib } from "../../generators/init_react/gen_request_lib";
import { gen_socket_context } from "../../generators/init_react/gen_socket_context";
import { gen_store } from "../../generators/init_react/gen_store";
import { gen_update_apps_package_json } from "../../generators/add_ui/gen_update_apps_package_json";
import { inject_package_scripts } from "../../injectors/init_react/inject_package_scripts";
import { inject_react_deps } from "../../injectors/init_react/inject_react_deps";
import { inject_redux_provider } from "../../injectors/init_react/inject_redux_provider";
import { inject_socket_provider } from "../../injectors/init_react/inject_socket_provider";
import { inject_ui_package_minimal_for_add_ui } from "../../injectors/add_ui/inject_ui_package_minimal_for_add_ui";
import { inject_ui_to_custom_compiler } from "../../injectors/add_ui/inject_ui_to_custom_compiler";
import { inject_ui_to_page_controller } from "../../injectors/add_ui/inject_ui_to_page_controller";
import { inject_ui_to_router } from "../../injectors/add_ui/inject_ui_to_router";
import { inject_ui_static_serving } from "../../injectors/add_ui/inject_ui_static_serving";
import { AppData } from "../../readers/get_app_data";

const build_tool_agnostic_init_tasks_for_add_ui = async (appdata: AppData, uiName: string) => {
  const tasks = await Promise.all([
    gen_update_apps_package_json(appdata, uiName),
    inject_ui_package_minimal_for_add_ui(appdata, uiName),
    inject_ui_to_custom_compiler(appdata, uiName),
    inject_ui_to_page_controller(appdata, uiName),
    inject_ui_to_router(appdata, uiName),
    inject_ui_static_serving(appdata, uiName),
    gen_store(appdata, uiName),
    await inject_redux_provider(appdata, uiName),
    inject_socket_provider(appdata, uiName),
    gen_lorem_utils(appdata),
    gen_request_lib(appdata),
    inject_package_scripts(appdata, uiName),
    inject_react_deps(appdata, uiName),
    gen_jest_config(appdata, uiName),
    gen_jest_setup(appdata, uiName),
    gen_socket_context(appdata),
    gen_index_html(appdata, uiName),
    gen_demo_component_styles(appdata),
  ]).catch(console.error);

  return [tasks].flat();
};

export { build_tool_agnostic_init_tasks_for_add_ui };
