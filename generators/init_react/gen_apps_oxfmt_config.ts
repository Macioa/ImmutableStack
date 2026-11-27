import path from "path";
import { writeFile } from "fs/promises";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

// Prettier 3 defaults, so oxfmt output matches the previous Prettier formatting
const OXFMT_CONFIG = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
};

const gen_apps_oxfmt_config = async ({ AppDir }: AppData) => {
  const file = path.join(AppDir, ".oxfmtrc.json");
  log({ level: 2, color: "BLUE" }, `\nGenerating apps/.oxfmtrc.json...`);
  await writeFile(file, `${JSON.stringify(OXFMT_CONFIG, null, 2)}\n`);
  return { type: "file_created", path: file, content: "oxfmt config with Prettier defaults" };
};

export { gen_apps_oxfmt_config };
