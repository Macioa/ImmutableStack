import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_vite_watcher_to_config = async (
  AppName: string,
  AppNameCamel: string,
  umbrellaDir: string,
) => {
  const file = path.join(umbrellaDir, `config/config.exs`);
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /\# Import environment specific config\. This must remain at the bottom[\s\n]+\# of this file so it overrides the configuration defined above\.[\s\n]+import_config \"\#\{config_env\(\)\}\.exs\"/,
      `
if Mix.env() == :dev do
  config :${AppName}_web, ${AppNameCamel}Web.Endpoint,
    watchers: [
      npm: [
        "run",
        "dev",
        cd: Path.expand("../apps/${AppName}_ui", __DIR__)
      ]
    ]
  end\n\n
`,
    ],
  ];

  return inject_file({ file, injections }, "inject_vite_watcher_to_config");
};

export { inject_vite_watcher_to_config };
