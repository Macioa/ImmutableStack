import { log } from "../utils/logger";
import { getSetting } from "../utils/settings";

const mixOrDocker = async (cmd: string, appNameSnake: string) => {
  const usemix = (await getSetting("nomix")) != "true";
  if (usemix) return cmd;
  const hasmix = !!cmd.match(/\bmix\b/g);
  const hasnew = !!cmd.match(/\bphx.new\b/g);
  let pref = ""
  let dockerdir = "docker/compose.yaml";
  if (hasmix) { 
    log({ level: 2, color: "PINK" }, `Running MIX in Docker...`)
  }
  if (hasnew) {
    pref = `mkdir -p ${appNameSnake}_umbrella && cd ${appNameSnake}_umbrella && `
    cmd = `${cmd} && cp -rf ${appNameSnake}_umbrella/* . && rm -rf ${appNameSnake}_umbrella`;
    dockerdir = "docker/compose.yaml";
  }

  return hasmix
    ? `${pref}docker compose -f ${dockerdir} run --rm ${appNameSnake}_dev bash -c "shopt -s dotglob && ${cmd}"`
    : cmd;
};

export default mixOrDocker;
