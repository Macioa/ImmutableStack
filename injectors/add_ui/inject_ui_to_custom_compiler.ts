import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "@/readers/get_app_data";
import { log } from "@/utils/logger";

const inject_ui_to_custom_compiler = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, LibDir } = appdata;
  const file = path.join(LibDir, "lib/mix/tasks/custom_compiler.ex");
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} to custom compiler...`
  );

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      /project_uis\s*=\s*\[/,
      `      {"npm run build:${uiName}", Path.join([app_path, "./..", "${AppNameSnake}_${uiName}"]) |> Path.expand()},\n`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_ui_to_custom_compiler"
  );
};

export { inject_ui_to_custom_compiler };
