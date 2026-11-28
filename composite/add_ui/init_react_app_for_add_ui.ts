import path from "path";
import { gen_app_css } from "../../generators/init_react/gen_app_css";
import { gen_app_tsx } from "../../generators/init_react/gen_app_tsx";
import { gen_index_css } from "../../generators/init_react/gen_index_css";
import { remove_vite_template_assets } from "../../generators/init_react/remove_vite_template_assets";
import { inject_display_font } from "../../injectors/init_react/inject_display_font";
import { inject_build_aliases } from "../../injectors/init_react/inject_build_aliases";
import { inject_vite_build_output } from "../../injectors/init_react/inject_vite_build_output";
import { AppData } from "../../readers/get_app_data";
import { scaffold_react_app_with_vite } from "../init_react/init_react_app_with_vite";
import { log } from "../../utils/logger";

// offline: create-vite from the local npx cache, for projects using the dep cache
const init_react_app_for_add_ui = async (
  appdata: AppData,
  uiName: string = 'ui',
  { offline = false }: { offline?: boolean } = {}
) => {
  const init = await scaffold_react_app_with_vite(appdata, uiName, { offline });

  log(
    { level: 1, color: "BLUE" },
    "\nConfiguring Vite build output and aliases..."
  );

  const tasks = [
    await inject_build_aliases(appdata, uiName),
    await inject_vite_build_output(appdata, uiName),
    await gen_app_tsx(appdata, uiName),
    await gen_app_css(appdata, uiName),
    await gen_index_css(appdata, uiName),
    await remove_vite_template_assets(appdata, uiName),
    await inject_display_font(appdata, uiName),
  ];

  return tasks.flat();
};

export { init_react_app_for_add_ui };
