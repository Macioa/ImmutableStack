import {
  gen_api_endpoint,
  gen_api_router,
  gen_api_application,
  gen_api_telemetry,
  gen_api_gettext,
  gen_api_web_module,
  gen_api_mix_exs,
  gen_api_user_socket,
  gen_api_readme,
  gen_api_error_json,
  gen_api_fallback_controller,
  gen_api_page_controller,
  gen_api_status_controller,
  gen_api_conn_case,
  gen_api_test_helper,
  gen_api_error_json_test,
  ApiAppData,
} from "../../generators/gen_web_api";
import {
  inject_api_to_umbrella_mix,
  inject_api_to_config,
  inject_api_to_dev_config,
} from "../../injectors/gen_web_api";
import { log } from "../../utils/logger";
import { execute as exec } from "../../runners";

const gen_web_api = async (apiAppData: ApiAppData) => {
  const { AppNameSnake, ApiNameSnake, UmbrellaDir } = apiAppData;

  log({ level: 2, color: "BLUE" }, `\nGenerating Web API: ${AppNameSnake}_${ApiNameSnake}...`);

  const generators = await Promise.all([
    gen_api_mix_exs(apiAppData),
    gen_api_web_module(apiAppData),
    gen_api_endpoint(apiAppData),
    gen_api_router(apiAppData),
    gen_api_application(apiAppData),
    gen_api_telemetry(apiAppData),
    gen_api_gettext(apiAppData),
    gen_api_user_socket(apiAppData),
    gen_api_error_json(apiAppData),
    gen_api_fallback_controller(apiAppData),
    gen_api_page_controller(apiAppData),
    gen_api_status_controller(apiAppData),
    gen_api_conn_case(apiAppData),
    gen_api_test_helper(apiAppData),
    gen_api_error_json_test(apiAppData),
    gen_api_readme(apiAppData),
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

export { gen_web_api };

