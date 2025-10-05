import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_readme_react = async ({ UiDir, AppNameCamel }: AppData) => {
  let dir = UiDir || "";
  const filename = "README.md";
  const content = `# ${AppNameCamel} UI

React/TypeScript frontend with Vite.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Formatting

\`\`\`bash
npm run format
\`\`\`

## Parent Repository

Part of [${AppNameCamel}.Umbrella](../..)

---

*Generated with [ImmutableStack](https://www.immutablestack.com)*`;

  return generateFile({ filename, dir, content }, "gen_readme_react");
};

export { gen_readme_react };
