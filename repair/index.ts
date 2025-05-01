import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import { join } from "path";
import { log } from "../utils/logger";
import { StringOnlyMap } from "../utils/map";
import { getSetting } from "../utils/settings";
import adapters from "./adapters";

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

const repair = async (params: Repair, type = "full") => {
  params = { ...defaults, ...params };

  //@ts-ignore
  return (await repairFn)(params);
};

const getContext = async ({
  context = [],
}: RepairI): Promise<{ name: string; body: string; desc: string }[]> => {
  const contexts: Promise<{ name: string; body: string; desc: string }[]> =
    Promise.all(
      context.map(async ({ name, filename, dir, targets, desc }) => {
        const filePath = join(dir, filename);
        const fileContent = await fs.readFile(filePath, "utf8");

        const matchedSections = targets
          .map((regex) => {
            if (typeof regex === "function") return regex(fileContent);
            const match = fileContent.match(regex);
            return match ? match[0] : null;
          })
          .filter((m): m is string => !!m);

        return {
          name,
          body: matchedSections.join("\n\n"),
          desc,
        };
      })
    );

  log({ level: 7 }, "getting context", { context, contexts });
  return contexts;
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
    return match ? match[0] : "";
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
    `[\\s\\/]{3}\\*\\*\\sIMMUTABLE\\s${e}\\s${t}\\s${id.source}\\s\\*\\*\\n`, //\\s\\*\\*\\n`,
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
export { getContext, getTarget, mark, marked, repairFn };
export type {
  API_Fn, Repair,
  RepairI, RepairRequest, RepairRequestReply, TypeFn
};

