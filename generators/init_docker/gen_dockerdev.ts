import { join } from "path";
import { ImmutableGenerator } from "../../immutable_gen";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_docker_dev = async ({ UmbrellaDir }: AppData) => {
  let dir = UmbrellaDir;
  dir = join(dir, "docker");
  const filename = "dev.dockerfile";
  const content = `FROM elixir:1.18-alpine

# Install Node.js and necessary build tools
RUN apk add --no-cache \
  build-base \
  git \
  npm \
  nodejs \
  inotify-tools \
  bash

# Install Hex and Rebar
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix archive.install hex phx_new --force

ENV PATH="$MIX_HOME/archives:$PATH"

# Set working directory
WORKDIR /app`;

  return generateFile({ filename, dir, content }, "gen_docker_dev");
};

export { gen_docker_dev };
