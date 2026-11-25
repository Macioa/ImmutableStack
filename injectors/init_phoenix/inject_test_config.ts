import { envConfigFile } from "@/utils/config_paths";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "../../readers/get_app_data";

// Lets containerized tests reach the compose database service
const inject_test_config = async ({ UmbrellaDir }: AppData) => {
  const file = envConfigFile(UmbrellaDir, "test");
  const injections: Injection[] = [
    [InjectType.REPLACE, /hostname: "localhost"/, `hostname: System.get_env("DB_HOST", "localhost")`],
  ];
  return inject_file({ file, injections }, "inject_test_config");
};

export { inject_test_config };
