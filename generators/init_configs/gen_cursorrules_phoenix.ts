import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_cursorrules_phoenix = async ({ LibDir, WebDir }: AppData) => {
  const filename = ".cursorrules";
  
  // Phoenix lib app cursor rules
  const libContent = `# Phoenix Application Rules

## Project Type
Elixir/Phoenix application with shared functionality and data layer.

## Structure
- \`lib/\` - Core application code
- \`lib/[app_name]/\` - Main application modules
- \`lib/[app_name]/repo.ex\` - Ecto repository
- \`lib/[app_name]/application.ex\` - Application supervisor
- \`lib/typescript/\` - Generated TypeScript code for frontend
- \`test/\` - Application tests
- \`priv/\` - Private assets (migrations, seeds)

## Guidelines
- Follow Phoenix conventions and patterns
- Use Ecto schemas for data modeling
- Implement proper error handling with \`{:ok, result}\` and \`{:error, reason}\` tuples
- Use GenServer for stateful processes
- Keep shared functionality in contexts, not controllers

## Code Style
- Use \`defmodule\` with proper nesting
- Prefer \`|>\` for function composition
- Use pattern matching extensively
- Follow Elixir naming conventions (snake_case for functions/variables)

## Testing
- Use ExUnit for testing
- Test files in \`test/\` directory
- Use \`mix test\` to run tests
- Mock external dependencies appropriately`;

  // Phoenix web app cursor rules  
  const webContent = `# Phoenix Web Interface Rules

## Project Type
Phoenix web interface handling HTTP requests, WebSocket connections, and static assets.

## Structure
- \`lib/[app_name]_web/\` - Web interface modules
- \`lib/[app_name]_web/controllers/\` - HTTP request handlers
- \`lib/[app_name]_web/channels/\` - WebSocket channel handlers
- \`lib/[app_name]_web/router.ex\` - Route definitions
- \`lib/[app_name]_web/endpoint.ex\` - Phoenix endpoint configuration
- \`priv/static/\` - Static assets served by Phoenix

## Guidelines
- Keep controllers thin - delegate shared functionality to contexts
- Use Phoenix LiveView for real-time features when appropriate
- Implement proper error handling with fallback controllers
- Use plugs for cross-cutting concerns (authentication, validation)
- Follow RESTful conventions for API endpoints

## Code Style
- Use \`defmodule\` with proper Phoenix web module structure
- Use \`conn\` for request/response handling
- Prefer \`render/3\` for JSON responses
- Use \`assign/3\` for connection state management

## Testing
- Test controllers with \`ConnCase\`
- Test channels with \`ChannelCase\`
- Mock external API calls
- Test both success and error scenarios`;

  return Promise.all([
    generateFile({ filename, dir: LibDir, content: libContent }, "gen_cursorrules_phoenix_lib"),
    generateFile({ filename, dir: WebDir, content: webContent }, "gen_cursorrules_phoenix_web")
  ]);
};

export { gen_cursorrules_phoenix };
