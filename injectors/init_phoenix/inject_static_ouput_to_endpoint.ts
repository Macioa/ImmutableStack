import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_static_output_to_endpoint = async ({
  AppNameSnake,
  WebDir,
}: AppData) => {
  const file = path.join(WebDir, `lib/${AppNameSnake}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /(?<=plug\(Plug\.Static\,.*only:\s)[^\n]*/s,
      `~w(assets fonts images js css vite.svg index.html)`,
    ],
  ];

  return inject_file({ file, injections }, "inject_static_output_to_endpoint");
};

export { inject_static_output_to_endpoint };
