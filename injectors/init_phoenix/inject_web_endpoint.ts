import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_web_endpoint = async ({
  AppNameSnake,
  WebDir,
}: AppData) => {
  const file = path.join(WebDir, `lib/${AppNameSnake}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /plug\sPlug\.MethodOverride/,
      `plug CORSPlug, origin: Application.compile_env(:${AppNameSnake}, CORSPlug)[:origin]\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_web_endpoint");
};

export { inject_web_endpoint };
