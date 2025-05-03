import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import { join } from "path";
import { log } from "../utils/logger";
import { StringOnlyMap } from "../utils/map";
import { getSetting } from "../utils/settings";
import adapters from "./adapters";
import { getNamesFromSingularSnakeCase, Names } from "../utils/string";
import { getAppData } from "../readers/get_app_data";
import fullFileRepair from "./types/full";

const repairFn: Promise<API_Fn> = (async function () {
  return adapters[await getSetting("llm")];
})();

interface Repair {
  filename: string;
  dir: string;
  target: (RegExp | Function)[];
  context: {
    name: string;
    filename: string;
    dir: string;
    targets: (RegExp | Function)[];
    desc: string;
  }[];
  output: string[];
  prompt: string;
  type?: string;
}

type RepairI = Partial<Repair>;

const defaults = {
  context: [],
  output: [],
};

interface RepairRequest {
  prompt: string;
  context: { name: string; body: string; desc: string }[];
  target: string;
  output: string[];
}

interface RepairRequestReply {
  api: string;
  id: string;
  model: string;
  result: string;
  usage: object;
}

type API_Fn = (_: RepairRequest) => Promise<RepairRequestReply | null>;
type TypeFn = (_: Repair) => Promise<string>;

const APP_DATA = (async function () {
  return await getAppData();
})();

enum TARGETS {
  APPSTATE = "APPSTATE",
  INITIAL_APPSTATE = "INITIAL_APPSTATE",
  GENERIC_APPSTATE = "GENERIC_APPSTATE",
  REDUCER = "REDUCER",
  SELECTOR = "SELECTOR",
  REDUCER_TEST = "REDUCER_TEST",
  SELECTOR_TEST = "SELECTOR_TEST",
  TYPEDEF = "TYPEDEF",
}

type TARGET_DICT = {
  [key in TARGETS]: string;
};

const TARGET_ROUTES = async function (entity: string): Promise<TARGET_DICT> {
  const { AppNameSnake } = (await APP_DATA) || {};
  const { singleUpperCamel } = getNamesFromSingularSnakeCase(entity) || {};
  return {
    APPSTATE: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    INITIAL_APPSTATE: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    GENERIC_APPSTATE: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    REDUCER: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    SELECTOR: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    REDUCER_TEST: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.test.tsx`,
    SELECTOR_TEST: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.test.tsx`,
    TYPEDEF: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
  };
};

const get_target_routes = async (entity: string, targets: TARGETS[]) => {
  const routes = await TARGET_ROUTES(entity);
  return targets.map((target) => routes[target]);
};

const repair = async (params: RepairI, type = "FULL") => {
  params = { ...defaults, ...params };
  if (type == "FULL") return fullFileRepair(await repairFn, params);
};

const getContext = async ({
  context = [],
}: RepairI): Promise<{ name: string; body: string; desc: string }[]> => {
  await Promise.all(context);
  log({ level: 7, color: "YELLOW" }, "Context", await Promise.all(context));
  const contexts: Promise<{
    name: string;
    body: string;
    desc: string;
  } | null>[] = (await Promise.all(context))
    .filter((m) => !!m)
    .map(async (con) => {
      const { name, filename, dir, targets, desc } = await con;
      if (!dir) return Promise.resolve(null);
      const filePath = join(dir, filename || "");
      const fileContent = await fs.readFile(filePath, "utf8");

      const matchedSections = targets
        ?.filter((regex: Function | RegExp | null) => !!regex)
        .map((regex) => {
          regex ||= /.*/gms;
          if (typeof regex === "function") return regex(fileContent);
          const match = fileContent.match(regex);
          return match ? match[0] : null;
        });

      return {
        name,
        body: matchedSections.join("\n\n"),
        desc,
      };
    });

  log({ level: 7 }, "getting context", await context, await contexts);
  return (await Promise.all(contexts)).filter((c) => !!c);
};

const getTarget = async ({
  filename = "",
  dir = "",
  target = [/.+/],
}: RepairI): Promise<string[]> => {
  const filePath = join(dir, filename);
  const fileContent = await fs.readFile(filePath, "utf8");
  log({ level: 7 }, "getting target", { filename, dir, target, fileContent });

  return target.map((regex: RegExp | Function) => {
    if (typeof regex === "function") return regex(fileContent);
    const match = fileContent.match(regex);
    return match || [];
  });
};

const mark = ({ str, type, entity = "" }: StringOnlyMap) => {
  const id = randomUUID();
  const tag = `// ** IMMUTABLE ${entity} ${type} ${id} **`;
  return ["", tag, str, tag, ""].join("\n");
};

const marked = ({
  entity,
  type,
  regX,
}: { [key: string]: RegExp | string } = {}) => {
  let {
    entity: e,
    type: t,
    regX: r,
  } = {
    entity: entity || "\\w*",
    type: type || "",
    regX: regX || `.*`,
  };
  //@ts-ignore
  [e, t, r] = [e, t, r]
    // convert type
    .map((v) => {
      switch (typeof v) {
        case "string":
          return new RegExp(v).source;
        case "object":
          return v?.source || "";
        default:
          return "";
      }
    })
    // Nullify capture grouops (necessary for ID match)
    .map((v) => v.replace(/(\()(?!\?)/g, "(?:"))
    // Recapture
    .map((v) => `(${v})`);
  const id = new RegExp("([a-z\\d\\-]{36})", "g");
  const prefix = new RegExp(
    `[\\s\\/]{3}\\*\\*\\sIMMUTABLE\\s${e}\\s${t}\\s${id.source}\\s\\*\\*\\n`,
    "gsm"
  );
  const suffix = new RegExp(
    `[\\s\\/]{3}\\*\\*\\s+IMMUTABLE\\s${e}\\s${t}\\s\\3\\s\\*\\*`,
    "gsm"
  );
  const pattern = new RegExp(
    `(?<=${prefix.source})(.*)(?=${suffix.source})`,
    "gsm"
  );
  return (str: string) => {
    // // High computational debugging
    // console.log({ prefix, suffix, pattern });
    // console.log({
    //   id: str.match(id),
    //   prefix: str.match(prefix),
    //   suffix: str.match(suffix),
    //   pattern: str.match(pattern),
    // });
    return str.match(pattern)?.[0];
  };
};

export default repair;
export {
  getContext,
  getTarget,
  get_target_routes,
  TARGET_ROUTES,
  mark,
  marked,
  repairFn,
};
export type {
  API_Fn,
  Repair,
  RepairI,
  RepairRequest,
  RepairRequestReply,
  TypeFn,
  TARGETS,
};
