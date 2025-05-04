import { readFile } from "fs/promises";
import { join } from "path";
import { getAppData } from "../readers/get_app_data";
import { log } from "../utils/logger";
import { getSetting } from "../utils/settings";
import { getNamesFromSingularSnakeCase } from "../utils/string";
import adapters from "./adapters";
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
  REDUCER_TEST = "REDUCER_TEST",
  SELECTOR = "SELECTOR",
  SELECTOR_TEST = "SELECTOR_TEST",

  FACTORY = "FACTORY",
  TYPEDEF = "TYPEDEF",

  REQUEST_API = "REQUEST_API",

  API_RESPONSE = "API_RESPONSE",

  SCHEMA = "SCHEMA",
  CONTEXT = "CONTEXT",
  CONTEXT_TEST = "CONTEXT_TEST",
  CONTROLLER = "CONTROLLER",
  JSON_HANDLER = "JSON_HANDLER",
  FALLBACK_CONTROLLER = "FALLBACK_CONTROLLER",

  ROUTER = "ROUTER",
}

type TARGET_DICT = {
  [key in TARGETS]: string;
};

const TARGET_ROUTES = async function (entity: string): Promise<TARGET_DICT> {
  const { AppNameSnake } = (await APP_DATA) || {};
  const { singleUpperCamel, singleSnake } =
    getNamesFromSingularSnakeCase(entity) || {};
  return {
    APPSTATE: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    INITIAL_APPSTATE: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    GENERIC_APPSTATE: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    REDUCER: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    REDUCER_TEST: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.test.tsx`,
    SELECTOR: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    SELECTOR_TEST: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.test.tsx`,
    TYPEDEF: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    FACTORY: `apps/${AppNameSnake}/lib/typescript/state/${singleUpperCamel}.tsx`,
    REQUEST_API: `apps/${AppNameSnake}/lib/typescript/requests/${singleUpperCamel}.tsx`,
    //
    API_RESPONSE: `apps/${AppNameSnake}/lib/typescript/requests/${singleUpperCamel}.tsx`,
    //
    SCHEMA: `apps/${AppNameSnake}/lib/${AppNameSnake}/${singleSnake}.ex`,
    //
    CONTEXT: `apps/${AppNameSnake}/lib/${singleSnake}_context.ex`,
    CONTEXT_TEST: `apps/${AppNameSnake}/test/${singleSnake}_context_test.exs`,
    CONTROLLER: `apps/${AppNameSnake}_web/lib/${AppNameSnake}_web/controllers/${singleSnake}_controller.ex`,
    JSON_HANDLER: `apps/${AppNameSnake}_web/lib/${AppNameSnake}_web/controllers/${singleSnake}_json.ex`,
    FALLBACK_CONTROLLER: `apps/${AppNameSnake}_web/lib/${AppNameSnake}/controllers/fallback_controller.ex`,
    //
    ROUTER: `apps/${AppNameSnake}_web/lib/${AppNameSnake}_web/router.ex`,
  };
};

enum CommentType {
  EX = "EX",
  JS = "JS",
  TS = "TS",
}
type CommentDict = {
  [key in CommentType]: string;
};
const COMMENT_TYPES: CommentDict = {
  EX: "#",
  JS: "//",
  TS: "//",
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
      const fileContent = await readFile(filePath, "utf8");

      const matchedSections = targets
        ?.filter((regex: Function | RegExp | null) => !!regex)
        .map((regex) => {
          regex ||= /.*/gms;
          if (typeof regex === "function") return regex(fileContent);
          const match = fileContent.match(regex);
          return match || [];
        })
        .flat();

      return {
        name,
        body: JSON.stringify(matchedSections),
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
  const fileContent = await readFile(filePath, "utf8");
  log({ level: 7 }, "getting target", { filename, dir, target, fileContent });

  return target.map((regex: RegExp | Function) => {
    if (typeof regex === "function") return regex(fileContent);
    return fileContent.match(regex) || [];
  });
};

const mark = (
  {
    str,
    type,
    entity = "",
  }: {
    str: string;
    type: string;
    entity?: string;
  },
  lang = CommentType.TS
) => {
  const id = crypto.randomUUID();
  const tag = `${COMMENT_TYPES[lang]} ** IMMUTABLE ${entity} ${type} ${id} **`;
  return ["", tag, str, tag, ""].join("\n");
};

const marked = (
  { entity, type, regX }: { [key: string]: RegExp | string },
  lang = CommentType.TS
) => {
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
  const id = new RegExp("([a-z\\d\\-]{36})", "g").source;
  const commentType = new RegExp(`[\\s\\${COMMENT_TYPES[lang]}]{3}`, "g")
    .source;
  const prefix = new RegExp(
    `${commentType}\\*\\*\\sIMMUTABLE\\s${e}\\s${t}\\s${id}\\s\\*\\*\\n`,
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
  get_target_routes,
  getContext,
  getTarget,
  mark,
  marked,
  repairFn,
  TARGET_ROUTES,
};
export type {
  API_Fn,
  CommentType,
  Repair,
  RepairI,
  RepairRequest,
  RepairRequestReply,
  TARGETS,
  TypeFn,
};
