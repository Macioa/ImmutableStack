import { log } from "../utils/logger";
import { getSetting } from "../utils/settings";

const mixOrDocker = async (cmd: string, appNameSnake: string) => {
  const usemix = (await getSetting("nomix")) != "true";
  if (usemix) return cmd;
  const hasmix = !!cmd.match(/.*\smix\s.*/g);
  const hasnew = !!cmd.match(/.*\sphx.new\s.*/g);
  let pref = ""
  if (hasmix) { 
    log({ level: 2, color: "BLUE" }, `Running MIX in Docker...`)
  }
  if (hasnew) {
    pref = `cd ${appNameSnake}_umbrella && `
    cmd = `${cmd} && cp -rf ${appNameSnake}_umbrella/* . && rm -rf ${appNameSnake}_umbrella`;
  }

  return hasmix
    ? `${pref}docker compose -f docker/compose.yaml run --rm ${appNameSnake}_dev bash -c "shopt -s dotglob && ${cmd}"`
    : cmd;
};

export default mixOrDocker;
