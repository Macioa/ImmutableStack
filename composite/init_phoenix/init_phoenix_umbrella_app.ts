import { execute as exec } from "../../runners";
import { log } from "../../utils/logger";
import { StringOnlyMap, validate } from "../../utils/map";

import { inject_app_declarations } from "../../injectors/init_phoenix/inject_app_declarations";
import { inject_dev_config } from "../../injectors/init_phoenix/inject_dev_config";
import { inject_phoenix_libs } from "../../injectors/init_phoenix/inject_phoenix_libs";
import { inject_web_endpoint } from "../../injectors/init_phoenix/inject_web_endpoint";
import { gen_phx_utils } from "../../generators/init_phoenix/phx_utils";
import { inject_scrinever } from "../../injectors/init_phoenix/inject_scrinever_to_repo";
import { configure_phoenix_to_serve_react } from "./configure_phoenix_to_serve_react";
import { inject_deps_get_aliases_to_mix_exs } from "../../injectors/init_phoenix/inject_deps_get_aliases_to_mix_exs";
import { configure_phoenix_to_format_react } from "./configure_phoenix_to_format_react";
import { gen_fallback_controller } from "../../generators/init_phoenix/gen_fallback_controller";
import { gen_id_validation_plug } from "../../generators/init_phoenix/gen_id_validation_plug";
import { mark_router } from "../../injectors/init_phoenix/mark_router";

const init_phoenix_umbrella_app = async ({
  projectName,
  projectNameCamel,
  umbrellaDir,
  libdir,
  webdir,
}: StringOnlyMap) => {
  validate(
    { projectName, projectNameCamel, umbrellaDir, libdir, webdir },
    "init_phoenix_umbrella_app"
  );
  log({ level: 2, color: "BLUE" }, "\nGenerating Phoenix project...");
  const init = await exec(
    {
      command: `yes | mix phx.new ${projectName} --no-live --no-html --no-assets --binary-id --umbrella --no-install`,
      dir: ".",
    },
    "init_phoenix_umbrella_app"
  );
  const declarations = await inject_app_declarations(projectName, umbrellaDir);
  const tasks = await Promise.all([
    inject_phoenix_libs(projectName, { WebDir: webdir, LibDir: libdir }),
    inject_web_endpoint(projectName, webdir),
    inject_dev_config(projectName, umbrellaDir),
    inject_scrinever({ LibDir: libdir, AppNameSnake: projectName }),
    gen_phx_utils(projectNameCamel, libdir),
    gen_id_validation_plug(projectNameCamel, libdir),
    gen_fallback_controller({
      WebDir: webdir,
      AppNameCamel: projectNameCamel,
      AppNameSnake: projectName,
    }),
    mark_router({ WebDir: webdir, AppNameSnake: projectName }),
  ]);
  const configure = await configure_phoenix_to_serve_react({
    AppName: projectName,
    AppNameCamel: projectNameCamel,
    WebDir: webdir,
    LibDir: libdir,
  });
  const format = await configure_phoenix_to_format_react({
    AppName: projectName,
    LibDir: libdir,
  });
  const depsget = await inject_deps_get_aliases_to_mix_exs(
    projectName,
    umbrellaDir
  );

  return [init, declarations, tasks, configure, format, depsget].flat();
};

export { init_phoenix_umbrella_app };
