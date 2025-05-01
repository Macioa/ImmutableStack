import { getSetting } from "../utils/settings";
import adapters from "./adapters";
import * as fs from "fs/promises";
import { join } from "path";
import { log } from "../utils/logger";
import { StringOnlyMap } from "../utils/map";
import { randomUUID } from "crypto";

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

const mark = ({ str, entity, type }: StringOnlyMap) => {
  const id = randomUUID();
  const tag = `// ** IMMUTABLE ${entity} ${type} ${id} **`;
  return `${tag}\n${str}\n${tag}`;
};

const marked = ({
  entity,
  type,
  regX,
}: { [key: string]: string | RegExp | null } = {}) => {
  let {
    entity: e,
    type: t,
    regX: r,
  } = {
    entity: entity || null,
    type: type || `\\w+`,
    regX: regX || `.*`,
  };
  //@ts-ignore
  [e, t, r] = [e, t, r].map((v) => {
    switch (typeof v) {
      case "string":
        return new RegExp(v).source;
      case "object":
        return v?.source;
      default:
        return "";
    }
  });
  const id = new RegExp("[a-z\\d\\-]{36}", "g");
  const fixedPrefix = new RegExp(
    `[\\s\\/]{3}\\*\\*\\sIMMUTABLE\\s${e || ""}\\s${t}\\s${id.source}\\s\\*\\*`,
    "gs"
  );
  const _variablePrefix = new RegExp(
    `[\\s\\/]+\\*\\*\\s{1,5}IMMUTABLE\\s{0,5}${e}\\s{0,5}${t} ${id.source} \\*\\*\\n`,
    "gs"
  );
  const suffix = new RegExp(
    `\\n[\\s\\/]+\\*\\*\\s+IMMUTABLE\\s{0,5}${e || ""}\\s{0,5}${t} ${
      id.source
    } \\*\\*`,
    "gs"
  );

  const pattern = new RegExp(
    `(?<=${fixedPrefix.source})(.*)(?=${suffix.source})`,
    "gms"
  );
  return (str: string) => {
    console.log({ prefix: fixedPrefix, suffix, pattern });
    console.log({
      id: str.match(id),
      prefix: str.match(fixedPrefix),
      suffix: str.match(suffix),
      pattern: str.match(pattern),
    });
    return str.match(pattern)?.[0];
  };

  //   return (str: string) => {
  //     console.log({ prefix: fixedPrefix, suffix, pattern });
  //     console.log({
  //       id: str.match(id),
  //       prefix: str.match(fixedPrefix),
  //       suffix: str.match(suffix),
  //       pattern: str.match(pattern),
  //     });

  //     return str.replace(
  //       pattern,
  //       (
  //         match: string,
  //         _pre: string,
  //         selection: string,
  //         _suf: string
  //       ): string => {
  //         console.log({ match, selection, _pre, _suf });
  //         return selection;
  //       }
  //     );
  //   };
};

export default repair;
export { repairFn, getContext, getTarget, marked, mark };
export type {
  RepairRequest,
  Repair,
  RepairI,
  RepairRequestReply,
  API_Fn,
  TypeFn,
};
