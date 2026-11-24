import { Database } from "./database";

type Flags = { db: Database };

const DEFAULT_FLAGS: Flags = { db: "postgres" };

const FLAGS: Record<string, Partial<Flags>> = {
  "-sqlite": { db: "sqlite" },
};

const parseFlags = (args: string[]): Flags =>
  args.reduce((flags, arg) => ({ ...flags, ...FLAGS[arg] }), DEFAULT_FLAGS);

export { parseFlags };
export type { Flags };
