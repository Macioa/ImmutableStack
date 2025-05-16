import path from "path";
import { inject_file, Injection, InjectType } from "..";
import { AppData } from "../../readers/get_app_data";

const inject_dev_config = async ({ AppNameSnake, UmbrellaDir }: AppData) => {
  const file = path.join(UmbrellaDir, `config/dev.exs`);
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /config\s*:\w+\s*,\s*\w+\.\s*Endpoint\s*,/,
      `config :${AppNameSnake}, CORSPlug, origin: "*"\n`,
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
