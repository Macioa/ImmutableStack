import { join } from "@/utils/path";
import { generateFile } from "@/generators/index";
import { AppData } from "@/readers/get_app_data";

const gen_docker_base = async ({ UmbrellaDir }: AppData) => {
  const dir = join(UmbrellaDir, "docker");
  const filename = "base.dockerfile";
  const content = `# Standard build for every Docker workflow. Build only the target you need.
#   toolchain: OS packages, Hex, Rebar, and Phoenix generator
#   deps:      project dependencies, cached until a manifest or config changes
#   compiled:  full umbrella and UI, ready to run or release

FROM elixir:1.20-alpine AS toolchain
RUN apk add --no-cache build-base git npm nodejs inotify-tools bash postgresql-dev && npm install -g pnpm
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix archive.install hex phx_new 1.8.17 --force
WORKDIR /app

# Keeps only dependency manifests so source edits do not invalidate the deps layer
FROM alpine:3.20 AS manifests
COPY apps /apps
RUN find /apps -type f ! -name mix.exs ! -name package.json ! -name pnpm-lock.yaml ! -name pnpm-workspace.yaml -delete

FROM toolchain AS deps
ARG MIX_ENV=docker
ENV MIX_ENV=$MIX_ENV
COPY mix.exs mix.lock ./
COPY config config
COPY --from=manifests /apps apps
RUN mix deps.get && mix deps.compile --skip-umbrella-children

FROM deps AS compiled
ENV CODE_RELOADER=false
COPY apps apps
RUN mix compile
`;

  return generateFile({ filename, dir, content }, "gen_docker_base");
};

export { gen_docker_base };
