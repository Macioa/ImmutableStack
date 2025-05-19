import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_web_app_deps = async ({ WebDir }: AppData) => {
  const file = path.join(WebDir, "mix.exs");
  const injections: Injection[] = [
    [
      T.AFTER,
      /defp\sdeps\sdo\s*\n{0,5}\s*\[/,
      `\n      {:cors_plug, "~> 2.0"},\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_web_app_deps");
};

const inject_umbrella_deps = async ({ UmbrellaDir }: AppData) => {
  const file = path.join(UmbrellaDir, "mix.exs");
  const injections: Injection[] = [];

  return inject_file({ file, injections }, "inject_app_deps");
};

const inject_app_deps = async ({ LibDir }: AppData) => {
  const file = path.join(LibDir, "mix.exs");
  const injections: Injection[] = [
    [
      T.AFTER,
      /defp\sdeps\sdo\s*\n{0,5}\s*\[/,
      `\n{:scrivener, "~> 2.7"}, {:scrivener_ecto, "~> 3.0"}, {:phoenix, "~> 1.7.14"}, {:jason, "~> 1.2"}, {:dns_cluster, "~> 0.1.1"}, {:phoenix_pubsub, "~> 2.1"}, \n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_app_deps");
};

const inject_phoenix_deps = async (appdata: AppData) => {
  return Promise.all([
    inject_web_app_deps(appdata),
    inject_app_deps(appdata),
    inject_umbrella_deps(appdata),
  ]);
};

export { inject_phoenix_deps };
