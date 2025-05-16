var log_level = 3;

const COLOR = {
  GREEN: "\x1b[38;2;0;255;0m%s\x1b[0m",       // #00FF00
  RED: "\x1b[38;2;255;0;0m%s\x1b[0m",         // #FF0000
  YELLOW: "\x1b[38;2;255;255;0m%s\x1b[0m",    // #FFFF00
  BLUE: "\x1b[38;2;0;0;255m%s\x1b[0m",        // #0000FF
  TEAL: "\x1b[38;2;0;255;255m%s\x1b[0m",      // #00FFFF
  PURPLE: "\x1b[38;2;255;0;255m%s\x1b[0m",    // #FF00FF
  TAN: "\x1b[38;2;210;180;140m%s\x1b[0m",     // #D2B48C
  PINK: "\x1b[38;2;255;0;127m%s\x1b[0m"       // #FF007F
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
