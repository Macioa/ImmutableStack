import { join } from "../../utils/path";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "../../readers/get_app_data";
import { db } from "../../utils/database";

// Lets containerized tests reach the compose database service
const inject_test_config = async ({ UmbrellaDir, Database }: AppData) => {
  const file = join(UmbrellaDir, "config/test.exs");
  const injections: Injection[] = [
    [InjectType.REPLACE, /hostname: "localhost"/, `hostname: System.get_env("DB_HOST", "localhost")`],
    [InjectType.REPLACE, /database:/, db(Database).localize],
  ];
  return inject_file({ file, injections }, "inject_test_config");
};

export { inject_test_config };
