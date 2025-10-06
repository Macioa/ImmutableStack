/*
** Immutable Delete Repos **
    Delete all repositories for a given app name
      - requires an app name as an argument    
*/
import { log, setLogLevel } from "@/utils/logger";
import { getSetting } from "@/utils/settings";
import { deleteAppRepositories } from "@/utils/git";

setLogLevel(5);

const args = process.argv.slice(2);

async function main() {
  if (args.length < 1) {
    console.error(
      "Usage: node immutable_delete_repos.ts <app_name>\n   Or: immutable -delete_repos <app_name>"
    );
    process.exit(1);
  }

  const appName = args[0]
    .toLowerCase()
    .replace(/[\s-]/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  // Get git domain from settings
  const gitDomain = await getSetting("gitDom");
  if (!gitDomain) {
    console.error("Git domain not found in settings. Please set it first with: immutable -settings gitDomain: <your_git_domain>");
    process.exit(1);
  }

  try {
    await deleteAppRepositories(appName, gitDomain);
    log(
      { level: 1, color: "GREEN" },
      `\n\nSuccessfully deleted all repositories for ${appName}\n\n`
    );
  } catch (error) {
    log({ level: 1, color: "RED" }, `Failed to delete repositories: ${error}`);
    process.exit(1);
  }
}

main().catch(console.error);
