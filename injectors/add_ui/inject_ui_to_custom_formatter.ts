import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "@/readers/get_app_data";
import { log } from "@/utils/logger";

const inject_ui_to_custom_formatter = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, LibDir } = appdata;
  const file = path.join(LibDir, "lib/mix/tasks/custom_formatter.ex");
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} to custom formatter...`
  );

  const injections: Injection[] = [
    // Add UI to String.contains? check in Enum.split_with
    [
      InjectType.REPLACE,
      /(String\.contains\?\(path, "apps\/[^"]+"\) \|\|)/,
      `$1 String.contains?(path, "apps/${AppNameSnake}_${uiName}") ||`
    ],
    // Update regex pattern to include new UI
    [
      InjectType.REPLACE,
      /String\.replace\(&1, ~r\/\(\.\*\)\{0,1\}apps\\\\\/[^\/]+_(.+?)\\\\\//,
      (content: string) => {
        const match = content.match(/String\.replace\(&1, ~r\/\(\.\*\)\{0,1\}apps\\\\\/([^\/]+)_(.+?)\\\\\//);
        if (!match) return content;
        const [fullMatch, appName, existingPattern] = match;
        
        // Add new UI to the regex pattern if not already there
        if (existingPattern.includes(uiName)) return content;
        const newPattern = `(${existingPattern}|${uiName})`;
        return content.replace(fullMatch, fullMatch.replace(existingPattern, newPattern));
      }
    ],
    // Add UI to format_dirs array
    [
      InjectType.REPLACE,
      /format_dirs\s*=\s*\[([^\]]+), "[^"]+\/lib\/typescript"\]\s*\|>\s*Enum\.uniq\(\)/,
      (content: string) => {
        const match = content.match(/format_dirs\s*=\s*\[([^\]]+), "[^"]+\/lib\/typescript"\]\s*\|>\s*Enum\.uniq\(\)/);
        if (!match) return content;
        const existingDirs = match[1];
        
        // Add new UI if not already there
        if (existingDirs.includes(`"${AppNameSnake}_${uiName}"`)) return content;
        const newDirs = `${existingDirs}, "${AppNameSnake}_${uiName}"`;
        return content.replace(match[0], `format_dirs = [${newDirs}, "${AppNameSnake}/lib/typescript"] |> Enum.uniq()`);
      }
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_ui_to_custom_formatter"
  );
};

export { inject_ui_to_custom_formatter };
