import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_vite_supervisor_to_application_ex = async (
  AppName: string,
  AppNameCamel: string,
  WebDir: string,
) => {
  const file = path.join(WebDir, `lib/${AppName}_web/application.ex`);
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
    "inject_vite_supervisor_to_application_ex",
  );
};

export { inject_vite_supervisor_to_application_ex };
