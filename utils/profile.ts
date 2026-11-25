/*
** Profile **
    Times a step and prints its duration to the terminal, even when logs go to a file
*/
const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

const timed = async <T>(label: string, step: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  const result = await step();
  process.stdout.write(`  [time] ${label.padEnd(28)} ${formatSeconds(Date.now() - start)}\n`);
  return result;
};

export { timed, formatSeconds };
