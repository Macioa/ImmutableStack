import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const inject_ui_static_serving = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, AppDir } = appdata;
  const file = path.join(AppDir, `${AppNameSnake}_web/lib/${AppNameSnake}_web/endpoint.ex`);
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} static serving to endpoint...`
  );

  const injections: Injection[] = [
    [
      InjectType.AFTER,
      new RegExp(`plug\\(Plug\\.Static,\\s*\\n\\s*at:\\s*"\\/",\\s*\\n\\s*from:\\s*:${AppNameSnake}_web,\\s*\\n\\s*gzip:\\s*false,\\s*\\n\\s*only:\\s*[^\\n]*\\s*\\n\\s*\\)`, 's'),
      `\n\n  # Serve ${uiName} assets from subdirectory\n  plug(Plug.Static,\n    at: "/${uiName}",\n    from: {:${AppNameSnake}_web, "priv/static/${uiName}"},\n    gzip: false\n  )`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_ui_static_serving"
  );
};

export { inject_ui_static_serving };
