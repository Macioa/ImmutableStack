import path from "path";

const validatePath = (...args: string[]) => {
  if (!args.reduce((acc, v) => (!!v ? acc : false), true)) {
    console.error("Invalid Path", ...args);
    // throw new Error("Invalid path detected");
  }
};

const join = (...args: string[]) => {
  validatePath(...args);
  return path.join(...args);
};

const resolve = (...args: string[]) => {
  validatePath(...args);
  return path.join(...args);
};

export { join, resolve };
