import { existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const timestamp = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  return (
    now.getUTCFullYear().toString() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
};

const add_auth_migration = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const dir = join(AppDir || "", `${AppNameSnake}/priv/auth_repo/migrations`);
  const legacyDir = join(AppDir || "", `${AppNameSnake}/priv/repo/migrations`);
  const baseName = "create_users_auth_tables.exs";

  let filename = `${timestamp()}_${baseName}`;

  if (existsSync(dir)) {
    const existing = readdirSync(dir).find(name => name.endsWith(baseName));
    if (existing) {
      filename = existing;
    }
  }

  if (existsSync(legacyDir)) {
    const legacyMigration = readdirSync(legacyDir).find(name => name.endsWith(baseName));
    if (legacyMigration) {
      unlinkSync(join(legacyDir, legacyMigration));
    }
  }

  const content = `defmodule ${AppNameCamel}.AuthRepo.Migrations.CreateUsersAuthTables do
  use Ecto.Migration

  def change do
    execute "CREATE EXTENSION IF NOT EXISTS citext", ""

    create table(:users) do
      add :email, :citext, null: false
      add :hashed_password, :string, null: false
      add :confirmed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:email])

    create table(:users_tokens) do
      add :user_id, references(:users, on_delete: :delete_all), null: false
      add :token, :binary, null: false
      add :context, :string, null: false
      add :sent_to, :string

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create index(:users_tokens, [:user_id])
    create unique_index(:users_tokens, [:context, :token])
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_migration");
};

export { add_auth_migration };

