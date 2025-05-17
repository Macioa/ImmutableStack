import { join } from "../../utils/path";
import { inject_file, Injection, InjectType } from "../../injectors/index";
import { AppData } from "../../readers/get_app_data";

const inject_docker_scripts_package = ({
  UmbrellaDir,
  AppNameSnake,
}: AppData) => {
  const file = join(UmbrellaDir || "", "package.json");
  const content = `\n"APP MAINTENANCE DOCKERIZED": "echo 'APP MAINTENANCE'",
    "d.deps": "m='Fetching Dependencies (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml run --rm ${AppNameSnake}_dev mix deps.get",
    "d.comp": "m='Compiling Apps (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml run --rm ${AppNameSnake}_dev mix compile",
    "d.mig": "m='Running Database Migrations (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml run --rm ${AppNameSnake}_dev mix ecto.migrate",
    "APP STARTUP DOCKERIZED": "echo 'APP STARTUP'",
    "d.test": "m='Running Tests (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml run --rm test mix test",
    "d.serv": "m='Starting Server (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml up -d",
    "SERVICE LOGS": "echo 'SERVICE LOGS'",
    "d.logs": "m='Fetching Logs (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml logs --follow",
    "COMPOSE UTILITIES": "echo 'COMPOSE UTILITIES'",
    "d.build": "m='Building Apps (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml build",
    "d.restart": "m='Restarting Apps (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml restart -d",
    "BUILD, RUN, STOP, DESTROY CONTAINERS": "echo 'BUILD, RUN, STOP, DESTROY CONTAINERS'",
    "d.up": "m='Starting Apps (** Docker **) ...' && echo $m && yarn d.kill && yarn d.deps && yarn d.comp && yarn d.serv && yarn d.logs",
    "d.down": "m='Stopping Apps (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml down",
    "d.db": "m='Starting Only the Database (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml up -d ${AppNameSnake}_db",
    "HOLD OR KILL CONTAINERS": "echo 'HOLD OR KILL CONTAINERS'",
    "d.hold": "m='Holding Containers (** Docker **) ...' && echo $m && yarn d.up && docker compose -f docker/compose.yaml exec ${AppNameSnake}_dev sleep 1000000",
    "d.kill": "m='Killing Apps (** Docker **) ...' && echo $m && docker compose -f docker/compose.yaml kill",
    "PRODUCTION BUILD": "echo 'PRODUCTION BUILD'",
    "p.build": "m='Building Production Container (** Docker **) ...' && echo $m && docker build -f docker/prod.dockerfile -t ${AppNameSnake}_prod .",
    "p.hold": "m='Holding Production Container (** Docker **) ...' && echo $m && docker run -it --rm -p 4000:4000 ${AppNameSnake}_prod bash",\n`;
  const injections: Injection[] = [
    [InjectType.AFTER, /"scripts"\s*:\s\{/g, content],
  ];
  return inject_file(
    {
      file,
      injections,
    },
    "inject_docker_scripts_package"
  );
};

export { inject_docker_scripts_package };
