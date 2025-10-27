import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const inject_ui_to_vite_supervisor = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, AppNameCamel, AppDir } = appdata;
  const file = path.join(AppDir, `${AppNameSnake}/lib/mix/processes/vite_dev_supervisor.ex`);
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} to Vite supervisor...`
  );

  const injections: Injection[] = [
    // Add UI name to @ui_names array
    [
      InjectType.REPLACE,
      /\@ui_names \[([^\]]*)\]/,
      (content: string) => {
        const match = content.match(/\@ui_names \[([^\]]*)\]/);
        if (!match) return content;
        const existingUIs = match[1] || '';
        
        // Simply append the new UI name if not already present
        if (!existingUIs.includes(uiName)) {
          const newUIs = existingUIs ? `${existingUIs}, "${uiName}"` : `"${uiName}"`;
          return content.replace(/\@ui_names \[([^\]]*)\]/, `@ui_names [${newUIs}]`);
        }
        
        return content;
      }
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_ui_to_vite_supervisor"
  );
};

export { inject_ui_to_vite_supervisor };
