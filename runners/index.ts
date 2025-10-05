/**
 * @fileoverview Command execution runner with prereq support
 * 
 * Provides utilities for executing shell commands with support for:
 * - Prerequisite commands that must succeed before main execution
 * - Recovery commands for failed prerequisites
 * - Batch execution with chunking and synchronization options
 * - Interactive prompts and timeout handling
 * 
 * @example Basic execution:
 * ```typescript
 * execute({ command: "echo hello", dir: "/tmp", caller: "filename" })
 * ```
 * 
 * @example Multiple commands:
 * ```typescript
 * execute({ command: ["cmd1", "cmd2"], dir: "/tmp", caller: "filename" })
 * ```
 * 
 * @example With prerequisites:
 * ```typescript
 * execute({ 
 *   command: "main", 
 *   dir: "/tmp", 
 *   prereq: { command: "check", recover: "fix" }, 
 *   caller: "filename" 
 * })
 * ```
 * 
 * @example With options:
 * ```typescript
 * execute({ 
 *   command: "cmd", 
 *   dir: "/tmp", 
 *   options: { resolveOnErrorCode: true }, 
 *   caller: "filename" 
 * })
 * ```
 * 
 * @note caller should be filename (minus extension) that called the execution
 */

import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve as pathResolve } from "path";
import { getAppData } from "../readers/get_app_data";
import { chunkArray } from "../utils/chunk";
import { cacheLogCommand } from "../utils/history_cache";
import { log } from "@/utils/logger";
import mixOrDocker from "./nomix";

type Execution = {
  dir: string;
  command: string | string[];
  env?: NodeJS.ProcessEnv;
  options?: ExecutionOptions;
  prereq?: {
    command: string;
    dir?: string;
    recover?: string | string[];
  };
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
  const { dir, command: cInit, env, options, prereq } = { ...ExecutionDefaults, ...execution };
  const { timeoutResolve, timeoutReject, forceReturnOnPrompt, resolveOnErrorCode } = {
    ...ExecutionDefaults.options,
    ...options,
  };

  if (prereq) {
    const prereqDir = prereq.dir || dir;
    const prereqCommand = await mixOrDocker(
      prereq.command,
      (await getAppData())?.AppNameSnake || ""
    );
    
    const prereqResult = await new Promise<number>((resolve, reject) => {
      const executedDir = pathResolve(prereqDir);
      mkdirSync(executedDir, { recursive: true });
      const [cmd, ...args] = prereqCommand.split(" ");
      const child = spawn(cmd, args, { cwd: executedDir, shell: true, env });
      
      child.on("close", (exitcode) => resolve(exitcode || 0));
      child.on("error", (error) => {
        console.error(`Prereq spawn failed: ${prereqCommand}`, error);
        reject(error);
      });
      child.stderr.on("error", (error) => {
        console.error(`Prereq stderr error: ${prereqCommand}`, error);
        reject(error);
      });
    });

    if (prereqResult !== 0) {
      if (prereq.recover) {
        const recoverCommands = Array.isArray(prereq.recover) ? prereq.recover : [prereq.recover];
        for (const recoverCmd of recoverCommands) {
          const recoverCommand = await mixOrDocker(
            recoverCmd,
            (await getAppData())?.AppNameSnake || ""
          );
          await new Promise<void>((resolve, reject) => {
            const executedDir = pathResolve(prereqDir);
            const [cmd, ...args] = recoverCommand.split(" ");
            const child = spawn(cmd, args, { cwd: executedDir, shell: true, env });
            
            child.on("close", (exitcode) => {
              if (exitcode && exitcode !== 0) {
                console.error(`Recover command failed with exit code ${exitcode}: ${recoverCommand}`);
                reject(new Error(`Recover command failed with exit code ${exitcode}`));
              } else {
                resolve();
              }
            });
            child.on("error", (error) => {
              console.error(`Recover spawn failed: ${recoverCommand}`, error);
              reject(error);
            });
            child.stderr.on("error", (error) => {
              console.error(`Recover stderr error: ${recoverCommand}`, error);
              reject(error);
            });
          });
        }
      } else {
        throw new Error(`Prereq failed: ${prereq.command}`);
      }
    }
  }

  const commands = Array.isArray(cInit) ? cInit : [cInit];
  
  const processedCommands = [];
  for (const cmdInit of commands) {
    const command = await mixOrDocker(
      cmdInit,
      (await getAppData())?.AppNameSnake || ""
    );
    processedCommands.push(command);
    cacheLogCommand({ command, dir }, caller);
  }

  const commandList = processedCommands.map(cmd => `      ${cmd}`).join('\n');
  log({ level: 1, color: "PURPLE" }, `Executing:\n${commandList}`);
  log({ level: 1, color: "TEAL" }, `      in ${dir}...\n\n`);
  
  for (const command of processedCommands) {

    await new Promise((resolve, reject) => {
      const executedDir = pathResolve(dir);
      mkdirSync(executedDir, { recursive: true });
      const [cmd, ...args] = command.split(" ");
      const child = spawn(cmd, args, { cwd: executedDir, shell: true, env });

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
  }
  
  return dir;
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
      res.push(await execute(exec, caller));
    } catch (error) {
      console.error(error);
      res.push(error);
    }
  }
  return res;
};

export { Arrow, execute, executeAll, executeAllSync };
export type { Execution };

