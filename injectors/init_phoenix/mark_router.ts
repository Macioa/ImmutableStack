import path from "path";
import { inject_file, Injection, InjectType } from "..";
import { CommentType, mark } from "../../repair";
import { AppData } from "../../readers/get_app_data";

const mark_router = async ({ AppDir, AppNameSnake }: AppData, webName: string = 'web') => {
  const WebDir = path.join(AppDir, `${AppNameSnake}_${webName}`);
  const file = path.join(WebDir || ".", `lib/${AppNameSnake}_web/router.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /.*/gms,
      (str) => mark({ str, type: "ROUTER" }, "EX" as CommentType),
    ],
  ];

  return inject_file({ file, injections }, "mark_router");
};

export { mark_router };
