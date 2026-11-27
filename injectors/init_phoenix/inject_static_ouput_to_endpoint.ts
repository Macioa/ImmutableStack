import path from "path";
import { inject_file, Injection, InjectType } from "../index";
import { AppData } from "../../readers/get_app_data";

// The root Plug.Static, which raises in dev (raise_on_missing_only) for folders outside its `only` list
const rootStaticPlug = (AppNameSnake: string) =>
  new RegExp(`plug\\(Plug\\.Static,\\s*\\n\\s*at:\\s*"\\/",\\s*\\n\\s*from:\\s*:${AppNameSnake}_web,`);

// UI plugs go before the root plug, so /<ui> requests are served before the root plug can raise
const uiStaticPlug = (AppNameSnake: string, uiName: string): Injection => [
  InjectType.BEFORE,
  rootStaticPlug(AppNameSnake),
  `# Serve ${uiName} assets from subdirectory\n  plug(Plug.Static,\n    at: "/${uiName}",\n    from: {:${AppNameSnake}_web, "priv/static/${uiName}"},\n    gzip: false\n  )\n\n  `,
];

const inject_static_output_to_endpoint = async ({
  AppNameSnake,
  AppDir,
}: AppData, uiName: string = 'ui', webName: string = 'web') => {
  const WebDir = path.join(AppDir, `${AppNameSnake}_${webName}`);
  const file = path.join(WebDir, `lib/${AppNameSnake}_web/endpoint.ex`);
  const injections: Injection[] = [
    [
      InjectType.REPLACE,
      /(?<=plug\(Plug\.Static,[^)]*\sonly:\s)[^,\n]*/s,
      `~w(assets fonts images js css vite.svg index.html)`,
    ],
    uiStaticPlug(AppNameSnake, uiName),
  ];

  // Matches plug(Plug.Static, ...), parens the formatter adds
  return inject_file({ file, injections, formatFirst: true }, "inject_static_output_to_endpoint");
};

export { inject_static_output_to_endpoint, uiStaticPlug };
