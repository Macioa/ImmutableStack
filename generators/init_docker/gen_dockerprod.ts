import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_docker_prod = async ({ UmbrellaDir, AppNameSnake }: AppData) => {
  let dir = UmbrellaDir || "";
  dir += "/docker";
  const filename = "prod.dockerfile";
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
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get

# Digest static assets from the Phoenix app
RUN mix phx.digest --priv=apps/${AppNameSnake}_web/priv

# Compile entire umbrella and build release
RUN mix compile && mix release

# Stage 2: Minimal Runtime
FROM alpine:3.18 AS app

# Install runtime dependencies
RUN apk add --no-cache libstdc++ openssl ncurses-libs

# Set workdir
WORKDIR /app

# Copy the release from the builder stage
COPY --from=builder /app/_build/prod/rel/your_release_name ./

# Run the release
CMD ["bin/YOUR_RELEASE_NAME", "start"]`;

  return generateFile({ filename, dir, content }, "gen_docker_prod");
};

export { gen_docker_prod };
