import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve as pathResolve } from "path";
import { log } from "../utils/logger";
import { chunkArray } from "../utils/chunk";

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

const execute = async (execution: Execution) => {
  const { dir, command, options } = { ...ExecutionDefaults, ...execution };
  const {
    timeoutResolve,
    timeoutReject,
    forceReturnOnPrompt,
    resolveOnErrorCode,
  } = {
    ...ExecutionDefaults.options,
    ...options,
  };

  log({ level: 4, color: "YELLOW" }, `Executing: ${command}`);
  log({ level: 4 }, `      in ${dir}...`);

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
      console.error(`Error: ${error}`);
      reject(error);
    });

    child.on("close", (exitcode) => {
      if (!resolveOnErrorCode && exitcode) {
        console.error(`Process exited with exit code ${exitcode}:\n       ${command}`);
        reject(`Process exited with ${exitcode}`);
      } else resolve(dir);
    });

    if (timeoutResolve) setTimeout(() => resolve(dir), timeoutResolve);
    if (timeoutReject) setTimeout(() => reject("Time out"), timeoutReject);
  });
};

const executeChunk = async (executions: Execution[]) => {
  const promises = executions.map((execution) => execute(execution).catch(console.error));
  return Promise.all(promises);
};

const executeAll = async (executions: Execution[], chunkSize = 5) => {
  const queue = chunkArray(executions, chunkSize);
  let res: any[] = [];
  for (const chunk of queue) {
      res = [...res, await executeChunk(chunk)];
  }
  return res;
};

const executeAllSync = async (executions: Execution[]) => {
  let res: any[] = [];
  for (const exec of executions) {
    try {
      res = [...res, await execute(exec)];
    } catch (error) {
      console.error(error);
      res.push(error);
    }
  }

};

export type { Execution };
export { execute, executeAll, executeAllSync, Arrow };
