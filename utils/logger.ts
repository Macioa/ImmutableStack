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

const log = ({ level, color }: LogOptions, ...args: any[]) => {
  if (level <= log_level) {
    args = color ? [COLOR[color], ...args] : args;
    console.log(...args);
  }
};

export { setLogLevel, log };
