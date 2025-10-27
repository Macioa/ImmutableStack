import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";
import { log } from "../../utils/logger";

const inject_ui_to_page_controller_add_ui = async (appdata: AppData, uiName: string) => {
  const { AppNameSnake, AppNameCamel, AppDir } = appdata;
  const file = path.join(AppDir, `${AppNameSnake}_web/lib/${AppNameSnake}_web/controllers/page_controller.ex`);
  
  log(
    { level: 2, color: "BLUE" },
    `\nAdding ${AppNameSnake}_${uiName} route to page controller (add_ui process)...`
  );

  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /^end\s*$(?![\s\S]*^end\s*$)/m,
      `  def ${uiName}(conn, _params) do
    # Serve the static index.html file from ${uiName} directory
    conn
    |> put_resp_content_type("text/html")
    |> send_file(200, Path.join([:code.priv_dir(:${AppNameSnake}_web), "static", "${uiName}", "index.html"]))
  end

`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_ui_to_page_controller_add_ui"
  );
};

export { inject_ui_to_page_controller_add_ui };
