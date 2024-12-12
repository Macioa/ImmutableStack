var log_level = 99;

const COLOR = {
  GREEN: "\x1b[32m%s\x1b[0m",
  RED: "\x1b[31m%s\x1b[0m",
  YELLOW: "\x1b[33m%s\x1b[0m",
  BLUE: "\x1b[34m%s\x1b[0m",
};

interface LogOptions {
  level: number;
  color?: keyof typeof COLOR;
}

const setLogLevel = (level: number) => {
  log_level = level;
  return log_level;
};

const log = async ({ level, color }: LogOptions, ...args: any[]) => {
  if (level <= log_level) {
    args = color ? [COLOR[color], ...args] : args;
    if (level < 5) console.log("\n\n");
    console.log(...args);
    return await sleep(level >= 5 ? 0 : 5 - level);
  }
};

const sleep = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));

export { setLogLevel, log, sleep };
