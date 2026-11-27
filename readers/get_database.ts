import { existsSync, readFileSync } from "fs";
import { join } from "@/utils/path";
import { Database } from "@/utils/database";

// Projects initialized with -sqlite carry ecto_sqlite3 in the core app deps
const getDatabase = (LibDir: string): Database => {
  const file = join(LibDir, "mix.exs");
  return existsSync(file) && readFileSync(file, "utf8").includes(":ecto_sqlite3") ? "sqlite" : "postgres";
};

export { getDatabase };
