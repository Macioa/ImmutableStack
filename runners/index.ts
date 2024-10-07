import { spawn } from "child_process";
import { mkdirSync } from "fs";
import { resolve as pathResolve } from "path";
import { log } from "../utils/logger";

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
    child.stderr.on('data', (data) =>  console.error(`Error: ${data}`));
    child.on('close', (exitcode) => exitcode ? reject(null) : resolve([]) );
  });
};

const executeChunk = async (executions: Execution[]) => {
    const promises = executions.map((execution) => execute(execution))
    return Promise.all(promises)
}

const executeAll = async (executions: Execution[]) => {
    const chunkSize = 5;
    let resolved: Execution[] = []
    for (let i = 0; i < executions.length; i += chunkSize) {
      const chunk = executions.slice(i, i + chunkSize);
      const res = await executeChunk(chunk)
      resolved = [...resolved, ...res] as Execution[]
    }
    return resolved
}

const executeAllSync = async (executions: Execution[]) => {
    executions.forEach(async exec=> await execute(exec))
}

export type { Execution };
export { execute, executeAll, executeAllSync };
