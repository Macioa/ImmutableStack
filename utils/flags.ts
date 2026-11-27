import { Database } from "./database";

type Flags = { db: Database; cache: boolean; quick: boolean };

const DEFAULT_FLAGS: Flags = { db: "postgres", cache: false, quick: false };

const FLAGS: Record<string, Partial<Flags>> = {
  "-sqlite": { db: "sqlite" },
  "-cache": { cache: true },
  "-quick": { quick: true },
};

const isFlag = (arg: string) => arg in FLAGS;

const parseFlags = (args: string[]): Flags =>
  args.reduce((flags, arg) => ({ ...flags, ...FLAGS[arg] }), DEFAULT_FLAGS);

// Args without known flags, so flags can go anywhere on the command line
const positionalArgs = (args: string[]) => args.filter((arg) => !isFlag(arg));

export { parseFlags, positionalArgs };
export type { Flags };
