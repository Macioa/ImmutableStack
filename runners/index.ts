import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve as pathResolve } from "path";
import { getAppData } from "../readers/get_app_data";
import { chunkArray } from "../utils/chunk";
import { cacheLogCommand } from "../utils/history_cache";
import { log } from "../utils/logger";
import mixOrDocker from "./nomix";

type Execution = {
  dir: string;
  command: string;
  options?: ExecutionOptions;
};

type PromptAndReply = [string, string];

type ExecutionOptions = {
  timeoutResolve?: number;
  timeoutReject?: number;
  prompts?: PromptAndReply[];
  forceReturnOnPrompt?: boolean;
  resolveOnErrorCode?: boolean;
};

const ExecutionDefaults: Execution = {
  dir: "",
  command: "",
  options: { forceReturnOnPrompt: true },
};

enum Arrow {
  NO = "\x1b[D",
  YES = "\x1b[C",
}

const execute = async (execution: Execution, caller: string | null = null) => {
  const {
    dir,
    command: cInit,
    options,
  } = { ...ExecutionDefaults, ...execution };
  const {
    timeoutResolve,
    timeoutReject,
    forceReturnOnPrompt,
    resolveOnErrorCode,
  } = {
    ...ExecutionDefaults.options,
    ...options,
  };

  const command = await mixOrDocker(
    cInit,
    (await getAppData())?.AppNameSnake || ""
  );

  cacheLogCommand({ command, dir }, caller);

  log({ level: 1, color: "PURPLE" }, `Executing: ${command}`);
  log({ level: 1, color: "TEAL" }, `      in ${dir}...\n\n`);

  return new Promise((resolve, reject) => {
    const executedDir = pathResolve(dir);
    mkdirSync(executedDir, { recursive: true });
    const [cmd, ...args] = command.split(" ");
    const child = spawn(cmd, args, { cwd: executedDir, shell: true });

    child.stdout.on("data", (data) => {
      log({ level: 5 }, data.toString());
      if (options?.prompts) {
        options.prompts.forEach(([prompt, response]) => {
          if (data.toString().includes(prompt)) {
            const r = response + (forceReturnOnPrompt ? "\n" : "");
            child.stdin.write(r);
          }
        });
      }
    });

    child.stderr.on("error", (error) => {
      console.error(`Could not run ${command}:\n      ${error}`);
      reject(error || `Could not run ${command}`);
    });

    child.on("close", (exitcode) => {
      if (!resolveOnErrorCode && exitcode) {
        console.error(
          `Process exited with exit code ${exitcode}:\n       ${command}`
        );
        reject(`Process exited with ${exitcode}`);
      } else resolve(dir);
    });

    if (timeoutResolve) setTimeout(() => resolve(dir), timeoutResolve);
    if (timeoutReject)
      setTimeout(() => reject(new Error("Time out")), timeoutReject);
  });
};

const executeChunk = async (
  executions: Execution[],
  caller: string | null = null
) => {
  const promises = executions.map((execution) =>
    execute(execution, caller).catch(console.error)
  );
  return Promise.all(promises);
};

const executeAll = async (
  executions: Execution[],
  chunkSize = 5,
  caller: string | null = null
) => {
  const queue = chunkArray(executions, chunkSize);
  let res: any[] = [];
  for (const chunk of queue) {
    res = [...res, await executeChunk(chunk, caller)];
  }
  return res;
};

const executeAllSync = async (
  executions: Execution[],
  caller: string | null = null
) => {
  let res: any[] = [];
  for (const exec of executions) {
    try {
      res = [...res, await execute(exec, caller)];
    } catch (error) {
      console.error(error);
      res.push(error);
    }
  }
};

export { Arrow, execute, executeAll, executeAllSync };
export type { Execution };

