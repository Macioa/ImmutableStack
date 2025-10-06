import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_cursorrules = async ({ UmbrellaDir }: AppData) => {
  let dir = UmbrellaDir || "";
  const filename = ".cursorrules";
  const content = `# ImmutableStack Umbrella Project Rules

## Project Overview
This is an Immutable Stack project - Elixir/Phoenix backend with React/TypeScript frontend in an umbrella structure.

## Project Structure
- \`apps/[app_name]/\` - Domain Lib (Elixir + TS) (shared functionality)
- \`apps/[app_name]_ui/\` - React/TypeScript frontend application  
- \`apps/[app_name]_web/\` - Phoenix web interface (controllers, channels, views)
- \`config/\` - Phoenix configuration files
- \`docker/\` - Docker development and production setup

## Development Guidelines
- Use absolute paths when referencing files [[memory:7508622]]
- Follow existing patterns in the codebase
- Keep comments concise and avoid overly explanatory language [[memory:4548989]]
- Prefer minimal code output without unnecessary extras [[memory:4412123]]
- All imports should be declared at the top of files (no dynamic imports) [[memory:4412106]]

## Technology Stack
- **Backend**: Elixir/Phoenix with Ecto
- **Frontend**: React/TypeScript with Vite
- **Database**: PostgreSQL
- **Containerization**: Docker
- **Package Management**: Mix (Elixir), npm (Node.js)

## Code Style
- Elixir: Follow standard Elixir formatting
- TypeScript/React: Use functional components with hooks
- Use TypeScript strict mode
- Follow Phoenix conventions for controllers, channels, and contexts

## Testing
- Run tests with \`make test\` [[memory:5779166]]
- Phoenix tests in \`test/\` directories
- React tests with Jest

## Commands
- \`mix phx.server\` - Start Phoenix server
- \`npm run dev\` - Start React development server
- \`docker-compose up\` - Start development environment`;

  return generateFile({ filename, dir, content }, "gen_cursorrules");
};

export { gen_cursorrules };
