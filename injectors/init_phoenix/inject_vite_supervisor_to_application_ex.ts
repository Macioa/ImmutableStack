import path from "path";
import { inject_file, Injection, InjectType } from "../index";

const inject_vite_supervisor_to_application_ex = async (
  AppName: string,
  AppNameCamel: string,
  WebDir: string
) => {
  const file = path.join(WebDir, `lib/${AppName}_web/application.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      new RegExp(`${AppNameCamel}Web\\.Endpoint\\n\\s+\\]`),
`
      ${AppNameCamel}Web.Endpoint,
      (if (Mix.env() == :dev), do: {Hello4Web.ViteDevTest, []})
    ]
    |> Enum.filter(&(&1 != nil))
`,
    ],
  ];

  return inject_file({ file, injections });
};

export { inject_vite_supervisor_to_application_ex };
