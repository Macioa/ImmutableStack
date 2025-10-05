import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_readme = async ({ UmbrellaDir, AppNameCamel, AppNameSnake }: AppData) => {
  let dir = UmbrellaDir || "";
  const filename = "README.md";
  const content = `# ${AppNameCamel}.Umbrella

Phoenix umbrella application with React frontend.

## Structure

- \`apps/${AppNameSnake}/\` - Domain Lib (Elixir + TS) ([repository](https://github.com/macioa/${AppNameSnake}_lib.git))
- \`apps/${AppNameSnake}_ui/\` - React/TypeScript frontend ([repository](https://github.com/macioa/${AppNameSnake}_ui.git))
- \`apps/${AppNameSnake}_web/\` - Phoenix API interface ([repository](https://github.com/macioa/${AppNameSnake}_web.git))

## Repositories

- [Umbrella Repository](https://github.com/macioa/${AppNameSnake}_umbrella.git)
- [Lib Repository](https://github.com/macioa/${AppNameSnake}_lib.git)
- [UI Repository](https://github.com/macioa/${AppNameSnake}_ui.git)
- [API Repository](https://github.com/macioa/${AppNameSnake}_web.git)

## Development

\`\`\`bash
mix setup
mix phx.server
\`\`\`

Visit [localhost:4000](http://localhost:4000)

## Formatting

\`\`\`bash
mix format
\`\`\`

## Database

\`\`\`bash
mix ecto.migrate
mix ecto.gen.migration create_table_name
\`\`\`

## Docker

\`\`\`bash
docker-compose up
\`\`\`

---

*Generated with [ImmutableStack](https://www.immutablestack.com)*`;

  return generateFile({ filename, dir, content }, "gen_readme");
};

export { gen_readme };
