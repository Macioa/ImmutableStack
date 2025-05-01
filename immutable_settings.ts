import { log, setLogLevel } from "./utils/logger";
import {
    clearSettings,
    getSetting,
    readSettings,
    updateSetting,
} from "./utils/settings";

setLogLevel(3);

const [, , , ...args] = process.argv;

const chunk2 = (a: (string | number)[]) =>
  //@ts-ignore
  a.reduce((r, v, i) => (i % 2 ? r[r.length - 1].push(v) : r.push([v]), r), []);

const main = async () => {
  if (args[0] === "-clear") {
    clearSettings();
    log({ level: 1, color: "GREEN" }, "Settings cleared", {});
    return;
  }
  if (args[0] === "-print") {
    const settings = await readSettings();
    log({ level: 1, color: "GREEN" }, "Found settings.", { settings });
    return;
  }
  if (args[0] === "-get") {
    const r = args.slice(1).map(async (a) => await getSetting(a));
    const result = await Promise.all(r);
    log({ level: 1, color: "GREEN" }, "Found settings.", { result });
    return;
  }
  const newSettings: [string, string][] = chunk2(
    args.map((a) => a.replace(/[:,]/g, ""))
  );
  const stngs = newSettings.reduce(
    (acc: Record<string, string>, [key, value]) => {
      acc[key] = value;
      return acc;
    },
    {}
  );
  await updateSetting(stngs);
  log({ level: 1, color: "GREEN" }, "Settings updated", await readSettings());
};

main();
