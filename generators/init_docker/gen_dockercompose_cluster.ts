import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";

const NODES = [1, 2, 3];
const DEFAULT_COOKIE = "immutable_dev_cookie";

const hostName = (node: number) => `node${node}`;
const clusterHosts = () => NODES.map((node) => `app@${hostName(node)}`).join(",");
const hostPort = (node: number, offset: number) => 4000 + (node - 1) * 100 + offset;

const nodeService = (app: string) => (node: number) => `  ${app}_${hostName(node)}:
    <<: *node
    hostname: ${hostName(node)}
    ports:
      - "${hostPort(node, 0)}:4000"
      - "${hostPort(node, 1)}:4001"`;

// Every service runs the standard compiled image, so nodes never compile.
const clusterCompose = (app: string) => `x-node: &node
  image: ${app}_base:docker
  pull_policy: never
  command: elixir --sname app --cookie \${CLUSTER_COOKIE:-${DEFAULT_COOKIE}} -S mix phx.server --no-compile --no-deps-check
  environment:
    - CLUSTER_HOSTS=${clusterHosts()}
  depends_on:
    ${app}_setup:
      condition: service_completed_successfully

services:
  ${app}_setup:
    <<: *node
    pull_policy: build
    build:
      context: ..
      dockerfile: docker/base.dockerfile
      target: compiled
    command: bash -c "mix ecto.create --quiet --no-compile && mix ecto.migrate --quiet --no-compile"
    depends_on:
      ${app}_db:
        condition: service_healthy

${NODES.map(nodeService(app)).join("\n\n")}

  ${app}_db:
    extends:
      file: compose.yaml
      service: ${app}_db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -h 127.0.0.1 -U postgres"]
      interval: 2s
      timeout: 3s
      retries: 30
`;

const gen_docker_compose_cluster = async ({ UmbrellaDir, AppNameSnake }: AppData) =>
  generateFile(
    {
      filename: "compose.cluster.yaml",
      dir: `${UmbrellaDir || ""}/docker`,
      content: clusterCompose(AppNameSnake),
    },
    "gen_docker_compose_cluster"
  );

export { gen_docker_compose_cluster };
