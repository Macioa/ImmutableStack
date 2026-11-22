import { log } from "@/utils/logger";
import { ignoreErrors } from "../utils/os_adapter";
import { getSetting } from "../utils/settings";

const COMPOSE_FILE = "docker/compose.yaml";
const PORT_FILTERS = [4000, 5432, 5173]
  .map((port) => `--filter "publish=${port}"`)
  .join(" ");

// Halt existing containers to prevent port conflicts
const haltContainers = () =>
  [
    `docker compose -f ${COMPOSE_FILE} down`,
    `docker stop $(docker ps -q ${PORT_FILTERS})`,
    `docker rm $(docker ps -aq ${PORT_FILTERS})`,
  ]
    .map(ignoreErrors)
    .join(" && ");

const newProjectPrefix = (app: string) =>
  `${haltContainers()} && mkdir -p ${app}_umbrella && cd ${app}_umbrella && `;

const newProjectCommand = (cmd: string, app: string) =>
  `${cmd} && cp -rf ${app}_umbrella/* . && rm -rf ${app}_umbrella`;

const mixOrDocker = async (cmd: string, appNameSnake: string) => {
  if ((await getSetting("nomix")) != "true") return cmd;
  const hasmix = /\bmix\b/.test(cmd);
  const hasnew = /\bphx.new\b/.test(cmd);
  const command = hasnew ? newProjectCommand(cmd, appNameSnake) : cmd;
  if (!hasmix) return command;

  log({ level: 2, color: "PINK" }, `Running MIX in Docker...`);
  const prefix = hasnew ? newProjectPrefix(appNameSnake) : "";
  return `${prefix}docker compose -f ${COMPOSE_FILE} run --rm ${appNameSnake}_dev bash -c "shopt -s dotglob && ${command}"`;
};

export default mixOrDocker;
