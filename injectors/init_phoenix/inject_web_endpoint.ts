import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_web_endpoint = async ({AppNameCamel, WebDir}: AppData) => {
  const file = path.join(WebDir, `lib/${AppNameCamel}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.BEFORE,
      /plug\sPlug\.MethodOverride/,
      `plug CORSPlug, origin: Application.compile_env(:${AppNameCamel}, CORSPlug)[:origin]\n`,
    ],
  ];

  return inject_file({ file, injections }, "inject_web_endpoint");
};

export { inject_web_endpoint };
