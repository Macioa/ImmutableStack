import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

// Cinzel stands in for Copperplate where it is not installed (Linux, Android, Windows without Office).
// Browsers only download it when the display font stack reaches it.
const inject_display_font = async ({ AppNameSnake, AppDir }: AppData, uiName: string = "ui") => {
  const file = path.join(AppDir, `${AppNameSnake}_${uiName}`, "src/main.tsx");
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /import\s+['"]\.\/index\.css['"]/,
      `// Display font fallback for systems without Copperplate; only downloaded when used.\nimport "@fontsource/cinzel/latin-700.css";\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_display_font");
};

export { inject_display_font };
