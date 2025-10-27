import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_static_output_to_endpoint = async ({
  AppNameSnake,
  AppDir,
}: AppData, uiName: string = 'ui', webName: string = 'web') => {
  const WebDir = path.join(AppDir, `${AppNameSnake}_${webName}`);
  const file = path.join(WebDir, `lib/${AppNameSnake}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /(?<=plug\(Plug\.Static\,.*only:\s)[^\n]*/s,
      `~w(assets fonts images js css vite.svg index.html)`,
    ],
    [
      InjectType.AFTER,
      new RegExp(`plug\\(Plug\\.Static,\\s*\\n\\s*at:\\s*"\\/",\\s*\\n\\s*from:\\s*:${AppNameSnake}_web,\\s*\\n\\s*gzip:\\s*false,\\s*\\n\\s*only:\\s*[^\\n]*\\s*\\n\\s*\\)`, 's'),
      `\n\n  # Serve ${uiName} assets from subdirectory\n  plug(Plug.Static,\n    at: "/${uiName}",\n    from: {:${AppNameSnake}_web, "priv/static/${uiName}"},\n    gzip: false\n  )`,
    ],
  ];

  return inject_file({ file, injections }, "inject_static_output_to_endpoint");
};

export { inject_static_output_to_endpoint };
