import fs from "fs";
import path from "path";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "../../readers/get_app_data";

const inject_test_helper_exclusions = async ({ UmbrellaDir }: AppData) => {
  const appsDir = path.join(UmbrellaDir, "apps");
  
  // Scan for all Elixir apps (directories containing mix.exs)
  const apps = fs.readdirSync(appsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(appName => {
      const mixExsPath = path.join(appsDir, appName, "mix.exs");
      return fs.existsSync(mixExsPath);
    });

  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /ExUnit\.start\(\)/,
      `ExUnit.start(exclude: [:cluster])`,
    ],
  ];

  // Apply injections to all Elixir apps
  const results = await Promise.all(
    apps.map(async (appName) => {
      const testHelperPath = path.join(appsDir, appName, "test", "test_helper.exs");
      
      // Only inject if test_helper.exs exists
      if (fs.existsSync(testHelperPath)) {
        return await inject_file(
          { file: testHelperPath, injections }, 
          `inject_test_helper_exclusions_${appName}`
        );
      }
      return null;
    })
  );

  return results.filter(result => result !== null).flat();
};

export { inject_test_helper_exclusions };
