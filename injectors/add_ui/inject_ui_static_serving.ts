import path from "path";
import { inject_file, Injection } from "../index";
import { uiStaticPlug } from "../init_phoenix/inject_static_ouput_to_endpoint";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const inject_ui_static_serving = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, AppDir } = appdata;
  const file = path.join(AppDir, `${AppNameSnake}_web/lib/${AppNameSnake}_web/endpoint.ex`);
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} static serving to endpoint...`
  );

  const injections: Injection[] = [uiStaticPlug(AppNameSnake, uiName)];

  return inject_file(
    // Matches plug(Plug.Static, ...), parens the formatter adds
    { file, injections, formatFirst: true },
    "inject_ui_static_serving"
  );
};

export { inject_ui_static_serving };
