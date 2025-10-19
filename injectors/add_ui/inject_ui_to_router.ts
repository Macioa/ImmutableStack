import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const inject_ui_to_router = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, AppNameCamel, AppDir } = appdata;
  const file = path.join(AppDir, `${AppNameSnake}_web/lib/${AppNameSnake}_web/router.ex`);
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} route to router...`
  );

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /get\("\/", PageController, :index\)/,
      `    get("/${uiName}", PageController, :${uiName})`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_ui_to_router"
  );
};

export { inject_ui_to_router };
