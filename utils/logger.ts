var log_level = 1

const setLogLevel = (level: number) => {
  log_level = level
  return log_level
}

const log = (level: number, ...args: any[]) => {
  if (level <= log_level) {
    console.log(...args)
  }
}

export { setLogLevel, log }