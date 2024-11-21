import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_static_output_to_endpoint = async (
  AppName: string,
  WebDir: string
) => {
  const file = path.join(WebDir, `lib/${AppName}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /(?<=plug\(Plug\.Static\,.*only:\s)[^\n]*/s,
      `~w(assets fonts images js css *.svg index.html)`,
    ],
  ];

  return inject_file({ file, injections });
};

export { inject_static_output_to_endpoint };
