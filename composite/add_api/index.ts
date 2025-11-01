import {
  add_api_endpoint,
  add_api_router,
  add_api_application,
  add_api_telemetry,
  add_api_gettext,
  add_api_web_module,
  add_api_mix_exs,
  add_api_user_socket,
  add_api_readme,
  add_api_error_json,
  add_api_fallback_controller,
  add_api_page_controller,
  add_api_status_controller,
  add_api_conn_case,
  add_api_test_helper,
  add_api_error_json_test,
  ApiAppData,
} from "../../generators/add_api";
import {
  inject_api_to_umbrella_mix,
  inject_api_to_config,
  inject_api_to_dev_config,
} from "../../injectors/add_api";
import { log } from "../../utils/logger";
import { execute as exec } from "../../runners";

const add_api = async (apiAppData: ApiAppData) => {
  const { AppNameSnake, ApiNameSnake, UmbrellaDir } = apiAppData;

  log({ level: 2, color: "BLUE" }, `\nGenerating Web API: ${AppNameSnake}_${ApiNameSnake}...`);

  const generators = await Promise.all([
    add_api_mix_exs(apiAppData),
    add_api_web_module(apiAppData),
    add_api_endpoint(apiAppData),
    add_api_router(apiAppData),
    add_api_application(apiAppData),
    add_api_telemetry(apiAppData),
    add_api_gettext(apiAppData),
    add_api_user_socket(apiAppData),
    add_api_error_json(apiAppData),
    add_api_fallback_controller(apiAppData),
    add_api_page_controller(apiAppData),
    add_api_status_controller(apiAppData),
    add_api_conn_case(apiAppData),
    add_api_test_helper(apiAppData),
    add_api_error_json_test(apiAppData),
    add_api_readme(apiAppData),
  ]);

  log({ level: 2, color: "BLUE" }, "\nInjecting API into umbrella configuration...");

  const injectors = await Promise.all([
    inject_api_to_umbrella_mix(apiAppData),
    inject_api_to_config(apiAppData),
    inject_api_to_dev_config(apiAppData),
  ]);

  log({ level: 2, color: "GREEN" }, `\nWeb API ${AppNameSnake}_${ApiNameSnake} generated successfully!`);

  return [...generators, ...injectors].flat();
};

export { add_api };

