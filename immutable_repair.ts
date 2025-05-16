import { existsSync } from "fs";
import { resolve } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import repair, {
  marked,
  TARGET_ROUTES,
  TARGETS
} from "./repair";
import { log, setLogLevel } from "./utils/logger";
import { spawn } from 'child_process';

setLogLevel(5);

process.argv.splice(2, 1);
interface ARGS {
  file: string;
  entity: string;
  targets: TARGETS[];
  context: string[];
  contexttargets: TARGETS[];
  options: string[];
  [key: string]: any;
}

const argv = yargs(hideBin(process.argv))
  .command(
    "$0 <file> [entity]",
    "Repair the given entity in the file",
    (yargs) =>
      yargs
        .positional("file", {
          describe: "Target file",
          type: "string",
          coerce: (arg) => {
            const fullPath = resolve(arg);
            if (!existsSync(fullPath))
              throw new Error(`File not found: ${fullPath}`);
            return fullPath;
          },
        })
        .positional("entity", {
          describe: "Target entity",
          type: "string",
        }),
    (argv) => {
      log({ level: 11 }, "Parsed Args", argv);
    }
  )
  .option("prompt", {
    alias: "p",
    type: "string",
    describe: "Prompt for the repair",
  })
  .option("targets", {
    alias: "t",
    type: "string",
    array: true,
    describe: "Target types (REDUCER SELECTOR ETC)",
  })
  .option("context", {
    alias: "c",
    type: "string",
    array: true,
    describe: "Context entities",
  })
  .option("contexttargets", {
    alias: "f",
    type: "string",
    array: true,
    describe: "Context targets (REDUCER SELECTOR ETC)",
  })
  .option("options", {
    alias: "o",
    type: "string",
    array: true,
    describe: "Misc options",
  })
  .strict()
  .parse() as unknown as ARGS;

const main = async () => {
  //@ts-ignore
  const { file, entity, prompt, targets, context, contexttargets, options } = argv;
  log({ level: 8 }, "Processed Args", {
    file,
    targets,
    context,
    contexttargets,
    options,
    prompt
  });
  const result = await repair({
    filename: "",
    prompt: prompt || "Fix the target code in this file.",
    context: (await contextsFromArgs(argv)) || [],
    target: (await targetsFromArgs(argv)) || "",
    dir: file,
    output: [
      "Return the full contents of the file with changes made",
      "do not alter any code except in targets",
      "minimal changes for working code",
    ],
  });

  log({ level: 4, color: "GREEN" }, "Repair complete");
  log({ level: 4, color: "BLUE" }, `           in ${file}`);
  spawn('git', ['--paginate', 'diff', file], {
    stdio: 'inherit',
  });
  log({ level: 4, color: "GREEN" }, "Revert changes with");
  log({ level: 4, color: "BLUE" }, `           git checkout -- ${file}`);
};

const contextsFromArgs = async (args: ARGS) => {
  const { context = [], contexttargets = [] } = args;
  const result: any[] = [];

  for (const entity of context) {
    if (contexttargets.length) {
      for (const t of contexttargets) {
        const dir = (await TARGET_ROUTES(entity))[t] as string;
        result.push({
          name: `${entity} ${t}`,
          filename: "",
          dir,
          targets: [marked({ type: t })],
          desc: `${entity} ${t} Context`,
        });
      }
    } else {
      const dirs = await TARGET_ROUTES(entity);
      result.push({
        name: entity,
        filename: "",
        dir: Object.values(dirs)[0],
        targets: [/.*/gms],
        desc: `${entity} State Context`,
      });
    }
  }

  return result;
};

const targetsFromArgs = async (args: ARGS) => {
  const { targets = [] } = args;
  return (
    targets?.filter((t) => !!t).map((t: string) => marked({ type: t })) || [
      /.*/gms,
    ]
  );
};

main();
