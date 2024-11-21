
import { gen_custom_compiler } from "../../generators/init_phoenix/gen_custom_compiler";
import { gen_page_controller } from "../../generators/init_phoenix/gen_page_handler";
import { inject_custom_compile_to_mix_exs } from "../../injectors/init_phoenix/inject_custom_compile_to_mix_exs";
import { inject_page_to_router } from "../../injectors/init_phoenix/inject_page_to_router";
import { inject_static_output_to_endpoint } from "../../injectors/init_phoenix/inject_static_ouput_to_endpoint";

const configure_phoenix_to_serve_react = async (AppName:string, AppNameCamel:string, WebDir:string) => {
    const page_controller = await gen_page_controller(AppName, AppNameCamel, WebDir);
    const endpoint = await inject_static_output_to_endpoint(AppName, WebDir);
    const router = await inject_page_to_router(AppName, AppNameCamel, WebDir);
    const custom_compile = await gen_custom_compiler(AppName, WebDir);
    const mix = await inject_custom_compile_to_mix_exs(AppName, WebDir);

    return [page_controller, endpoint, router, custom_compile, mix].flat();
}

export { configure_phoenix_to_serve_react }