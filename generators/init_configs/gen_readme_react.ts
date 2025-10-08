import path from "path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_readme_react = async ({ AppNameSnake, AppDir, AppNameCamel }: AppData, uiName: string = 'ui') => {
  const dir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
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

## Building

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Parent Repository

Part of [${AppNameCamel}.Umbrella](../..)

*Note: These commands can also be managed through mix commands in the parent umbrella app.*

---

*Generated with [ImmutableStack](https://www.immutablestack.com)*`;

  return generateFile({ filename, dir, content }, "gen_readme_react");
};

export { gen_readme_react };
