import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_dynamic_port_config = async ({ UmbrellaDir, AppNameSnake }: AppData) => {
  const file = path.join(UmbrellaDir || ".", "config/dev.exs");
  const injections: Injection[] = [
    [
      T.REPLACE,
      /http: \[ip: \{0, 0, 0, 0\}, port: 4000\],/,
      `http: [ip: {0, 0, 0, 0}, port: System.get_env("PORT", "4000") |> String.to_integer()],`,
    ],
  ];

  return inject_file({ file, injections }, "inject_dynamic_port_config");
};

export { inject_dynamic_port_config };
