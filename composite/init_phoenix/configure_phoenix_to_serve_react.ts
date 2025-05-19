import { gen_config_export } from "../../generators/init_phoenix/gen_config_export";
import { gen_custom_compiler } from "../../generators/init_phoenix/gen_custom_compiler";
import { gen_page_controller } from "../../generators/init_phoenix/gen_page_handler";
import { inject_custom_compile_to_mix_exs } from "../../injectors/init_phoenix/inject_custom_compile_to_mix_exs";
import { inject_page_to_router } from "../../injectors/init_phoenix/inject_page_to_router";
import { inject_static_output_to_endpoint } from "../../injectors/init_phoenix/inject_static_ouput_to_endpoint";
import { AppData } from "../../readers/get_app_data";

const configure_phoenix_to_serve_react = async (appdata: AppData) => {
  const page_controller = await gen_page_controller(appdata);
  const endpoint = await inject_static_output_to_endpoint(appdata);
  const router = await inject_page_to_router(appdata);
  const custom_compile = await gen_custom_compiler(appdata);
  const export_config = await gen_config_export(appdata);
  const mix = await inject_custom_compile_to_mix_exs(appdata);

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
