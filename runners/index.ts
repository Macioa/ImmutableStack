import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve as pathResolve } from "path";
import { log } from "../utils/logger";
import { chunkArray } from "../utils/chunk";

type Execution = {
  dir: string;
  command: string;
  options?: object;
};

const ExecutionDefaults: Execution = {
  dir: '',
  command: '',
};

const execute = async (execution: Execution) => {
  const { dir, command } = { ...ExecutionDefaults, ...execution };
  log({level: 4}, `Executing: ${command}`);
  log({level: 4}, `      in ${dir}...`);

  return new Promise((resolve, reject) => {
    const executedDir = pathResolve(dir);
    mkdirSync(executedDir, { recursive: true });
    const [cmd, ...args] = command.split(' ');
    
    const child = spawn(cmd, args, { cwd: executedDir, shell: true });
    child.stdout.on('data', (data) => log({level: 5}, data.toString()));
    child.stderr.on('error', (error) =>  console.error(`Error: ${error}`));
    child.on('close', (exitcode) => exitcode ? reject(null) : resolve([]) );
  });
};

const executeChunk = async (executions: Execution[]) => {
    const promises = executions.map((execution) => execute(execution))
    return Promise.all(promises)
}

const executeAll = async (executions: Execution[], chunkSize = 5) => {
    const queue = chunkArray(executions, chunkSize);
    let results: any[] = [];

    for (let i = 0; i < queue.length; i++) {
        const chunkResults = await executeChunk(queue[i]);
        results = results.concat(chunkResults);
    }
    
    return results;
};

const executeAllSync = async (executions: Execution[]) => {
    executions.forEach(async exec=> await execute(exec))
}

export type { Execution };
export { execute, executeAll, executeAllSync };
