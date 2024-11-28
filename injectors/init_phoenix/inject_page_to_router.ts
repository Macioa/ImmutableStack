import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_page_to_router = async (
  AppName: string,
  AppNameCamel: string,
  WebDir: string,
) => {
  const file = path.join(WebDir, `lib/${AppName}_web/router.ex`);
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
