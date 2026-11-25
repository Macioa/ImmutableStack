import { appendFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { format } from "util";

var log_level = 3;
var log_file: string | null = null;

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

// Streams logs to a file instead of the terminal, without the reading delay
const setLogFile = (file: string | null) => {
  if (file) mkdirSync(dirname(file), { recursive: true });
  log_file = file;
  return log_file;
};

const writeToFile = (file: string, args: any[]) =>
  appendFileSync(file, `${format(...args)}\n`);

const writeToTerminal = (level: number, color: LogOptions["color"], args: any[]) => {
  const colored = color ? [COLOR[color], ...args] : args;
  const styled = level === 1 ? colored.map((a) => (typeof a === "string" ? `\x1b[1m${a}\x1b[0m` : a)) : colored;
  if (level < 4) process.stdout.write("\n");
  if (level === 1) process.stdout.write("\n");
  console.log(...styled);
  if (level < 3) process.stdout.write("\n");
  return sleep(level >= 5 ? 0 : 5 - level);
};

const log = async ({ level, color }: LogOptions, ...args: any[]) => {
  if (level > log_level) return;
  if (log_file) return writeToFile(log_file, args);
  return await writeToTerminal(level, color, args);
};

const sleep = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));

export { setLogLevel, setLogFile, log, sleep, log_level };
