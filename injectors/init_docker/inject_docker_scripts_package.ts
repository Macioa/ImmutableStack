import { join } from "../../utils/path";
import { inject_file, Injection, InjectType } from "../../injectors/index";
import { AppData } from "../../readers/get_app_data";
import { logScript } from "../../utils/os_adapter";

type DockerScript = [name: string, message: string, command?: string];

const COMPOSE = "docker compose -f docker/compose.yaml";
const dockerMessage = (action: string) => `${action} (** Docker **) ...`;

const dockerScripts = (app: string): DockerScript[] => [
  ["APP MAINTENANCE DOCKERIZED", "APP MAINTENANCE"],
  ["d.deps", dockerMessage("Fetching Dependencies"), `${COMPOSE} run --rm ${app}_dev mix deps.get`],
  ["d.comp", dockerMessage("Compiling Apps"), `${COMPOSE} run --rm ${app}_dev mix compile`],
  ["d.mig", dockerMessage("Running Database Migrations"), `${COMPOSE} run --rm ${app}_dev mix ecto.migrate`],
  ["APP STARTUP DOCKERIZED", "APP STARTUP"],
  ["d.test", dockerMessage("Running Tests"), `${COMPOSE} run --rm test mix test`],
  ["d.serv", dockerMessage("Starting Server"), `${COMPOSE} up -d`],
  ["SERVICE LOGS", "SERVICE LOGS"],
  ["d.logs", dockerMessage("Fetching Logs"), `${COMPOSE} logs --follow`],
  ["COMPOSE UTILITIES", "COMPOSE UTILITIES"],
  ["d.build", dockerMessage("Building Apps"), `${COMPOSE} build`],
  ["d.restart", dockerMessage("Restarting Apps"), `${COMPOSE} restart -d`],
  ["BUILD, RUN, STOP, DESTROY CONTAINERS", "BUILD, RUN, STOP, DESTROY CONTAINERS"],
  ["d.up", dockerMessage("Starting Apps"), "yarn d.kill && yarn d.deps && yarn d.comp && yarn d.serv && yarn d.logs"],
  ["d.down", dockerMessage("Stopping Apps"), `${COMPOSE} down`],
  ["d.db", dockerMessage("Starting Only the Database"), `${COMPOSE} up -d ${app}_db`],
  ["HOLD OR KILL CONTAINERS", "HOLD OR KILL CONTAINERS"],
  ["d.hold", dockerMessage("Holding Containers"), `yarn d.up && ${COMPOSE} exec ${app}_dev sleep 1000000`],
  ["d.kill", dockerMessage("Killing Apps"), `${COMPOSE} kill`],
  ["PRODUCTION BUILD", "PRODUCTION BUILD"],
  ["p.build", dockerMessage("Building Production Container"), `docker build -f docker/prod/${app}_web.dockerfile -t ${app}_prod .`],
  ["p.hold", dockerMessage("Holding Production Container"), `docker run -it --rm -p 4000:4000 ${app}_prod bash`],
];

const scriptEntry = ([name, message, command]: DockerScript) =>
  `"${name}": "${[logScript(message), command].filter(Boolean).join(" && ")}",`;

const dockerScriptsContent = (app: string) =>
  `\n${dockerScripts(app).map(scriptEntry).join("\n    ")}\n`;

const inject_docker_scripts_package = ({
  UmbrellaDir,
  AppNameSnake,
}: AppData) => {
  const file = join(UmbrellaDir || "", "package.json");
  const injections: Injection[] = [
    [InjectType.AFTER, /"scripts"\s*:\s\{/g, dockerScriptsContent(AppNameSnake)],
  ];
  return inject_file({ file, injections }, "inject_docker_scripts_package");
};

export { inject_docker_scripts_package };
