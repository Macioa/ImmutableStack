import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_web_app_libs = async (AppNameSnake: string, WebDir: string) => {
  const file = path.join(WebDir, "mix.exs");
  const injections: Injection[] = [
    [InjectType.AFTER, /defp\sdeps\sdo\s*\n{0,5}\s*\[/, `\n      {:cors_plug, "~> 2.0"},`],
  ];

  return inject_file({ file, injections });
};

const inject_umbrella_libs = async (
  AppNameSnake: string,
  UmbrellaDir: string
) => Promise.resolve(true);

const inject_app_libs = async (AppNameSnake: string, AppDir: string) => {
  console.log("APPDIR", AppDir);
  const file = path.join(AppDir, "mix.exs");
  const injections: Injection[] = [
    [InjectType.AFTER, /\{\:ecto_sql\, \".*\"\}\,/, `\n      {:scrivener_ecto, "~> 3.0"},`],
  ];

  return inject_file({ file, injections });
}

interface Phx_Dirs {
  WebDir?: string;
  AppDir?: string;
  UmbrellaDir?: string;
  LibDir?: string;
}

const inject_phoenix_libs = async (
  AppNameSnake: string,
  { WebDir, AppDir, UmbrellaDir, LibDir }: Phx_Dirs
) => {
  return Promise.all([
    inject_web_app_libs(AppNameSnake, WebDir || ""),
    inject_app_libs(AppNameSnake, LibDir || ""),
    inject_umbrella_libs(AppNameSnake, UmbrellaDir || ""),
  ]);
};

export { inject_phoenix_libs };
