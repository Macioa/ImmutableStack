import path from "path";
import { inject_file, Injection, InjectType as T } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_status_route = async ({ WebDir, AppNameSnake }: AppData) => {
  const file = path.join(WebDir || ".", `lib/${AppNameSnake}_web/router.ex`);
  const injections: Injection[] = [
    [
      T.AFTER,
      /scope "\/", .* do\s*\n/,
      `    get("/nodes", StatusController, :index)
`,
    ],
  ];

  return inject_file({ file, injections }, "inject_status_route");
};

export { inject_status_route };
