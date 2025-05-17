import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_index_html = async ({ UiDir, AppNameCaps }: AppData) => {
  const filename = "index.html";
  const content = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/react.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
