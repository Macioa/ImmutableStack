import path from "path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_index_html = async ({ AppNameCaps, AppNameSnake, AppDir }: AppData, uiName: string = 'ui') => {
  const UiDir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const filename = "index.html";
  const content = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, viewport-fit=cover"
    />
    <meta name="theme-color" content="#242424" />
    <meta name="color-scheme" content="dark" />
    <meta
      name="description"
      content="${AppNameCaps} - built on the Immutable Stack: Elixir, Phoenix, React and Redux"
    />
    <title>${AppNameCaps} - Immutable Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  return generateFile({ filename, dir: UiDir, content }, "gen_index_html");
};

export { gen_index_html };
