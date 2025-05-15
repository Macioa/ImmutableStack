var log_level = 3;

const COLOR = {
  GREEN: "\x1b[32m%s\x1b[0m",
  RED: "\x1b[31m%s\x1b[0m",
  YELLOW: "\x1b[33m%s\x1b[0m",
  BLUE: "\x1b[34m%s\x1b[0m",
  TEAL: "\x1b[96m%s\x1b[0m", // Bright Teal (Bright Cyan)
  PURPLE: "\x1b[35m%s\x1b[0m", // Rich Purple (Magenta)
  TAN: "\x1b[2;33m%s\x1b[0m", // Dim Yellow (soft tan-like hue)
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

    if (level < 4) process.stdout.write("\n");
    if (level === 1) {
      process.stdout.write("\n");
      args = args.map((a) =>
        typeof a === "string" ? `\x1b[1m${a}\x1b[0m` : a
      );
    }
    console.log(...args);
    if (level < 3) process.stdout.write("\n");
    return await sleep(level >= 5 ? 0 : 5 - level);
  }
};

const sleep = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));

export { setLogLevel, log, sleep, log_level };
