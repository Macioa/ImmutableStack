import { generateFile } from "../index";
import { join } from "../../utils/path";
import { ApiAppData } from "./add_api_endpoint";

const add_api_docker_prod = async ({ UmbrellaDir, AppNameSnake, ApiNameSnake }: ApiAppData) => {
  let dir = UmbrellaDir || "";
  dir = join(dir, "docker/prod");
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const filename = `${apiAppName}.dockerfile`;
  
  // Determine port logic same as inject_api_to_dev_config
  const apiNumber = ApiNameSnake.match(/\d+$/)?.[0] || "1";
  const port = apiNumber === "1" ? 4000 : 4000 + parseInt(apiNumber) - 1;
  const portEnv = apiNumber === "1" ? "PORT" : `PORT${apiNumber}`;
  
  const content = `# Stage 1: Build Elixir/Phoenix
FROM elixir:1.18-alpine AS builder

# Install OS dependencies
RUN apk add --no-cache build-base git npm nodejs postgresql-dev
RUN mix local.hex --force

# Set environment
ENV MIX_ENV=prod

# Set workdir
WORKDIR /app

# Copy umbrella root config + subapp definitions
COPY mix.exs mix.lock ./
COPY config config
COPY apps apps

# Install hex + rebar and fetch dependencies
RUN mix local.hex --force && \\
    mix local.rebar --force && \\
    mix deps.get

# Compile entire umbrella
RUN mix compile

# Build release for ${apiAppName} only
RUN mix release ${apiAppName}

# Stage 2: Minimal Runtime  
FROM alpine:latest AS app

# Install runtime dependencies
RUN apk add --no-cache libstdc++ openssl ncurses-libs ca-certificates

# Set workdir
WORKDIR /app

# Copy the release from the builder stage
COPY --from=builder /app/_build/prod/rel/${apiAppName} ./

# Expose port
EXPOSE ${port}

# Set default env vars
ENV ${portEnv}=${port}
ENV DATABASE_URL="ecto://postgres:postgres@localhost/${AppNameSnake}_db"
ENV SECRET_KEY_BASE="test-secret-key-base-change-in-production-use-mix-phx-gen-secret"

# Run the release
CMD ["bin/${apiAppName}", "start"]
`;

  return generateFile({ filename, dir, content }, "add_api_docker_prod");
};

export { add_api_docker_prod };

