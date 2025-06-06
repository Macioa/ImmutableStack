import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_docker_compose = async ({ UmbrellaDir, AppNameSnake }: AppData) => {
  let dir = UmbrellaDir || "";
  dir += "/docker";
  const filename = "compose.yaml";
  const content = `services:
  ${AppNameSnake}_dev:
    build:
      context: ..
      dockerfile: docker/dev.dockerfile
    volumes:
      - ../:/app:cached
      - /app/_build
    working_dir: /app
    command: bash -c "iex -S mix phx.server"
    ports:
      - "4000:4000"
      - "5173-5183:5173-5183"
    environment:
      - MIX_ENV=docker
      - NODE_ENV=development
      - DATABASE_URL=ecto://postgres:postgres@db:5432/${AppNameSnake}_dev
    depends_on:
      - ${AppNameSnake}_db
    tty: true
    stdin_open: true

  ${AppNameSnake}_db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${AppNameSnake}_db
    volumes:
      - ./pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"`;

  return generateFile({ filename, dir, content }, "gen_docker_compose");
};

export { gen_docker_compose };
