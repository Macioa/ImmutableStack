type Database = "postgres" | "sqlite";

const PG_CONNECTION = /username: "postgres",\n\s*password: "postgres",\n\s*hostname: [^\n]+,\n\s*database: "([^\n]+)",/;

const SQLITE_UUID = `(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))))`;

const sqliteConnection = (name: string) => `database: Path.expand("../../${name}.db", __DIR__),`;

const postgres = {
  adapter: "Ecto.Adapters.Postgres",
  deps: "",
  citext: `execute "CREATE EXTENSION IF NOT EXISTS citext", ""`,
  uuid: "gen_random_uuid()",
  connection: (name: string, hostname: string = `"localhost"`) =>
    `username: "postgres",\n  password: "postgres",\n  hostname: ${hostname},\n  database: "${name}",`,
  localize: (content: string) => content,
  adaptRepo: (content: string) => content,
};

// Docker and prod compile with Postgres; dev and test run on SQLite
const sqlite = {
  adapter: "if(Mix.env() in [:dev, :test], do: Ecto.Adapters.SQLite3, else: Ecto.Adapters.Postgres)",
  deps: `\n      {:ecto_sqlite3, "~> 0.26"},`,
  citext: "",
  uuid: SQLITE_UUID,
  connection: (name: string) => sqliteConnection(name),
  localize: (content: string) => content.replace(PG_CONNECTION, (_, name) => sqliteConnection(name)),
  adaptRepo: (content: string) => content.replace(postgres.adapter, sqlite.adapter),
};

const DATABASES = { postgres, sqlite };

const db = (Database: Database = "postgres") => DATABASES[Database];

export { db };
export type { Database };
