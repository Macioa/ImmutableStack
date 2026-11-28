import { Database } from "./database";

type Flags = { db: Database; cache: boolean; quick: boolean; agents: string[] };

const DEFAULT_FLAGS: Flags = { db: "postgres", cache: false, quick: false, agents: ["claude"] };

const FLAGS: Record<string, Partial<Flags>> = {
  "-sqlite": { db: "sqlite" },
  "-cache": { cache: true },
  "-quick": { quick: true },
};

// Flags that take the next arg as their value
const VALUE_FLAGS: Record<string, (value: string) => Partial<Flags>> = {
  "-agents": (value) => ({ agents: value.split(",").map((agent) => agent.trim().toLowerCase()).filter(Boolean) }),
};

const isFlag = (arg: string) => arg in FLAGS || arg in VALUE_FLAGS;

const isFlagValue = (args: string[], index: number) => index > 0 && args[index - 1] in VALUE_FLAGS;

const parseFlag = (args: string[]) => (flags: Flags, arg: string, index: number): Flags => {
  const parseValue = VALUE_FLAGS[arg];
  const value = args[index + 1];
  if (parseValue) return value && !isFlag(value) ? { ...flags, ...parseValue(value) } : flags;
  return { ...flags, ...FLAGS[arg] };
};

const parseFlags = (args: string[]): Flags => args.reduce(parseFlag(args), DEFAULT_FLAGS);

// Args without known flags or their values, so flags can go anywhere on the command line
const positionalArgs = (args: string[]) => args.filter((arg, index) => !isFlag(arg) && !isFlagValue(args, index));

export { parseFlags, positionalArgs };
export type { Flags };
