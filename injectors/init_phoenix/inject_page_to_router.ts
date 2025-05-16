import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_page_to_router = async ({
  AppNameSnake,
  AppNameCamel,
  WebDir,
}: AppData) => {
  const file = path.join(WebDir, `lib/${AppNameSnake}_web/router.ex`);
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /pipeline\s+\:api\s+do/,
      `
  scope "/", ${AppNameCamel}Web do
    get "/", PageController, :index
  end
`,
    ],
  ];

  return inject_file({ file, injections }, "inject_page_to_router");
};

export { inject_page_to_router };
