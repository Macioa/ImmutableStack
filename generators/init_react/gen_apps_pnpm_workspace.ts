import path from "path";
import { writeFile } from "fs/promises";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

// pnpm reads settings from pnpm-workspace.yaml. A flat node_modules like npm lets
// the UI and the lib/typescript symlink resolve transitive deps.
const WORKSPACE = `shamefullyHoist: true\n`;

const gen_apps_pnpm_workspace = async ({ AppDir }: AppData) => {
  const file = path.join(AppDir, "pnpm-workspace.yaml");
  log({ level: 2, color: "BLUE" }, `\nGenerating apps/pnpm-workspace.yaml...`);
  await writeFile(file, WORKSPACE);
  return { type: "file_created", path: file, content: "pnpm settings for centralized apps install" };
};

export { gen_apps_pnpm_workspace };
