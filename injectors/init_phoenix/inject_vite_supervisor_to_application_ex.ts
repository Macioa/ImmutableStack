import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

const inject_vite_supervisor_to_application_ex = async ({
  AppNameSnake,
  AppNameCamel,
  WebDir,
}: AppData) => {
  const file = path.join(WebDir, `lib/${AppNameSnake}_web/application.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      new RegExp(`${AppNameCamel}Web\\.Endpoint\\n\\s+\\]`),
      `
      ${AppNameCamel}Web.Endpoint,
      (if (Mix.env() == :dev), do: {${AppNameCamel}.ViteDevSupervisor, []})
    ]
    |> Enum.filter(&(&1 != nil))
`,
    ],
  ];

  return inject_file(
    { file, injections },
    "inject_vite_supervisor_to_application_ex"
  );
};

export { inject_vite_supervisor_to_application_ex };
