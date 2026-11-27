import { envConfigFile } from "@/utils/config_paths";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "../../readers/get_app_data";
import { devCorsConfig } from "../../utils/cors";

const inject_dev_config = async ({ AppNameSnake, UmbrellaDir }: AppData) => {
  const file = envConfigFile(UmbrellaDir, "dev");
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /config\s*:\w+\s*,\s*\w+\.\s*Endpoint\s*,/,
      `${devCorsConfig(AppNameSnake)}\n`,
    ],
    [
      InjectType.REPLACE,
      /(?<=config\s+:\w+,\s+\w+\.Repo,(\n\s+\w+:\s+[^\n]+){0,10}\n\s+database:\s+\")[^\n]+(?=\",)/,
      `postgres`,
    ],
  ];

  return inject_file({ file, injections }, "inject_dev_config");
};

export { inject_dev_config };
