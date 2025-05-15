import { join } from "../../utils/path";
import { gen_fallback_controller } from "../../generators/init_phoenix/gen_fallback_controller";
import { gen_id_validation_plug } from "../../generators/init_phoenix/gen_id_validation_plug";
import { gen_user_socket } from "../../generators/init_phoenix/gen_user_socket";
import { gen_phx_utils } from "../../generators/init_phoenix/phx_utils";
import { inject_app_declarations } from "../../injectors/init_phoenix/inject_app_declarations";
import { inject_deps_get_aliases_to_mix_exs } from "../../injectors/init_phoenix/inject_deps_get_aliases_to_mix_exs";
import { inject_dev_config } from "../../injectors/init_phoenix/inject_dev_config";
import { inject_phoenix_deps } from "../../injectors/init_phoenix/inject_phoenix_deps";
import { inject_scrinever } from "../../injectors/init_phoenix/inject_scrinever_to_repo";
import { inject_socket_to_endpoint } from "../../injectors/init_phoenix/inject_socket_to_endpoint";
import { inject_web_endpoint } from "../../injectors/init_phoenix/inject_web_endpoint";
import { mark_router } from "../../injectors/init_phoenix/mark_router";
import { AppData } from "../../readers/get_app_data";
import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";
import { configure_phoenix_to_format_react } from "./configure_phoenix_to_format_react";
import { configure_phoenix_to_serve_react } from "./configure_phoenix_to_serve_react";

const init_phoenix_umbrella_app = async (appdata: AppData) => {
  const { AppNameSnake, UmbrellaDir } = appdata;
  log({ level: 2, color: "BLUE" }, "\nGenerating Phoenix project...");
  const init = await exec(
    {
      command: `yes | mix phx.new ${AppNameSnake} --no-live --no-html --no-assets --binary-id --umbrella --no-install`,
      dir: join(UmbrellaDir, ".."),
    },
    "init_phoenix_umbrella_app"
  );
  const declarations = await inject_app_declarations(appdata);
  const tasks = await Promise.all([
    inject_phoenix_deps(appdata),
    inject_web_endpoint(appdata),
    inject_dev_config(appdata),
    inject_scrinever(appdata),
    gen_phx_utils(appdata),
    gen_id_validation_plug(appdata),
    gen_fallback_controller(appdata),
    mark_router(appdata),
  ]);
  const configure = await configure_phoenix_to_serve_react(appdata);
  const format = await configure_phoenix_to_format_react(appdata);
  const depsget = await inject_deps_get_aliases_to_mix_exs(appdata);
  const user_socket = await gen_user_socket(appdata);
  const socket = await inject_socket_to_endpoint(appdata);

  return [
    init,
    declarations,
    tasks,
    configure,
    format,
    depsget,
    socket,
    user_socket,
  ].flat();
};

export { init_phoenix_umbrella_app };
