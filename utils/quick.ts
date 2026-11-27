/*
** Quick Mode **
    -quick streams a command's logs to a file and skips the terminal reading delay
      - logs go to ~/.immutable_dep_cache/logs/<app>_<command>.log
      - step timings print to the terminal either way
    run_command wraps a command: deferred formatting with one pass at the end, and a total time
*/
import { join } from "path";
import { DEFAULT_CACHE_DIR } from "./dep_cache";
import { flushFormat, setDeferredFormat } from "./format";
import { setLogFile } from "./logger";
import { formatSeconds, timed } from "./profile";

const quickLogFile = (appName: string, command: string) =>
  join(DEFAULT_CACHE_DIR, "logs", `${appName}_${command}.log`);

const start_quick_mode = (appName: string, command: string, { quick = false }: { quick?: boolean } = {}) => {
  if (!quick) return null;
  const file = setLogFile(quickLogFile(appName, command));
  process.stdout.write(`Logging to ${file}\n`);
  return file;
};

const flush_deferred_format = () =>
  timed("format (one pass)", async () => {
    setDeferredFormat(false);
    return flushFormat();
  });

// Call start_quick_mode first, so logs before the command body skip the delay too
const run_command = async <T>(main: () => Promise<T>) => {
  const start = Date.now();
  setDeferredFormat(true);
  const result = await main();
  await flush_deferred_format();
  process.stdout.write(`  [time] ${"total".padEnd(28)} ${formatSeconds(Date.now() - start)}\n`);
  return result;
};

export { start_quick_mode, run_command, flush_deferred_format };
