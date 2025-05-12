import { gen_config_export } from "../../generators/init_phoenix/gen_config_export";
import { gen_custom_compiler } from "../../generators/init_phoenix/gen_custom_compiler";
import { gen_page_controller } from "../../generators/init_phoenix/gen_page_handler";
import { inject_custom_compile_to_mix_exs } from "../../injectors/init_phoenix/inject_custom_compile_to_mix_exs";
import { inject_page_to_router } from "../../injectors/init_phoenix/inject_page_to_router";
import { inject_static_output_to_endpoint } from "../../injectors/init_phoenix/inject_static_ouput_to_endpoint";
import { AppData } from "../../readers/get_app_data";
import { StringOnlyMap, validate } from "../../utils/map";

const configure_phoenix_to_serve_react = async (appdata: AppData) => {
 const { AppNameSnake, AppNameCamel, WebDir, LibDir } = appdata;
  const page_controller = await gen_page_controller(appdata);
  const endpoint = await inject_static_output_to_endpoint(AppNameSnake, WebDir);
  const router = await inject_page_to_router(AppNameSnake, AppNameCamel, WebDir);
  const custom_compile = await gen_custom_compiler(
    AppNameCamel,
    AppNameSnake,
    LibDir
  );
  const export_config = await gen_config_export(AppNameCamel, AppNameSnake, LibDir);
  const mix = await inject_custom_compile_to_mix_exs(AppNameSnake, WebDir);

  return [
    page_controller,
    endpoint,
    router,
    custom_compile,
    export_config,
    mix,
  ].flat();
};

export { configure_phoenix_to_serve_react };
