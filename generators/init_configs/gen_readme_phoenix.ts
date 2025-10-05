import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_readme_phoenix = async ({ LibDir, WebDir, AppNameCamel, AppNameSnake }: AppData) => {
  const filename = "README.md";
  
  // Phoenix lib app README
  const libContent = `# ${AppNameCamel}

Phoenix application with shared functionality and data layer.

## Development

\`\`\`bash
mix setup
mix phx.server
\`\`\`

## Testing

\`\`\`bash
mix test
\`\`\`

## Formatting

\`\`\`bash
mix format
\`\`\`

## Database

\`\`\`bash
mix ecto.migrate
mix ecto.gen.migration create_table_name
\`\`\`

## Parent Repository

Part of [${AppNameCamel}.Umbrella](../..)

---

*Generated with [ImmutableStack](https://www.immutablestack.com)*`;

  // Phoenix web app README
  const webContent = `# ${AppNameCamel}Web

Phoenix web interface with controllers, channels, and views.

## Development

\`\`\`bash
mix setup
mix phx.server
\`\`\`

Visit [localhost:4000](http://localhost:4000)

## Testing

\`\`\`bash
mix test
\`\`\`

## Formatting

\`\`\`bash
mix format
\`\`\`

## Database

\`\`\`bash
mix ecto.migrate
mix ecto.gen.migration create_table_name
\`\`\`

## Parent Repository

Part of [${AppNameCamel}.Umbrella](../..)

---

*Generated with [ImmutableStack](https://www.immutablestack.com)*`;

  return Promise.all([
    generateFile({ filename, dir: LibDir, content: libContent }, "gen_readme_phoenix_lib"),
    generateFile({ filename, dir: WebDir, content: webContent }, "gen_readme_phoenix_web")
  ]);
};

export { gen_readme_phoenix };
