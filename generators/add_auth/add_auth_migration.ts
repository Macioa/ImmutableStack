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

    create table(:users, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false, default: fragment("gen_random_uuid()")
      add :email, :citext, null: false
      add :hashed_password, :string, null: false
      add :confirmed_at, :utc_datetime

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:email])

    create table(:users_tokens) do
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
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

const add_auth_oauth_tokens_migration = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const dir = join(AppDir || "", `${AppNameSnake}/priv/auth_repo/migrations`);
  const baseName = "create_oauth_tokens.exs";
  let filename = `${timestamp()}_${baseName}`;

  if (existsSync(dir)) {
    const existing = readdirSync(dir).find(name => name.endsWith(baseName));
    if (existing) {
      filename = existing;
    }
  }

  const content = `defmodule ${AppNameCamel}.AuthRepo.Migrations.CreateOAuthTokens do
  use Ecto.Migration

  def change do
    create table(:oauth_tokens, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false, default: fragment("gen_random_uuid()")
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :provider, :string, null: false
      add :access_token, :text, null: false
      add :refresh_token, :text
      add :expires_at, :utc_datetime
      add :provider_user_id, :string

      timestamps(type: :utc_datetime)
    end

    create index(:oauth_tokens, [:user_id])
    create unique_index(:oauth_tokens, [:user_id, :provider])
    create index(:oauth_tokens, [:provider_user_id])
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_tokens_migration");
};

const add_auth_oauth_states_migration = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const dir = join(AppDir || "", `${AppNameSnake}/priv/auth_repo/migrations`);
  const baseName = "create_oauth_states.exs";
  let filename = `${timestamp()}_${baseName}`;

  if (existsSync(dir)) {
    const existing = readdirSync(dir).find(name => name.endsWith(baseName));
    if (existing) {
      filename = existing;
    }
  }

  const content = `defmodule ${AppNameCamel}.AuthRepo.Migrations.CreateOAuthStates do
  use Ecto.Migration

  def change do
    create table(:oauth_states) do
      add :state, :string, null: false
      add :provider, :string, null: false
      add :expires_at, :utc_datetime, null: false

      timestamps(type: :utc_datetime, updated_at: false)
    end

    create unique_index(:oauth_states, [:state])
    create index(:oauth_states, [:expires_at])
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_states_migration");
};

const add_auth_accounts_migration = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const dir = join(AppDir || "", `${AppNameSnake}/priv/auth_repo/migrations`);
  const baseName = "create_accounts_table.exs";
  let filename = `${timestamp()}_${baseName}`;

  if (existsSync(dir)) {
    const existing = readdirSync(dir).find(name => name.endsWith(baseName));
    if (existing) {
      filename = existing;
    }
  }

  const content = `defmodule ${AppNameCamel}.AuthRepo.Migrations.CreateAccountsTable do
  use Ecto.Migration

  def change do
    create table(:accounts, primary_key: false) do
      add :id, :uuid, primary_key: true, null: false, default: fragment("gen_random_uuid()")
      add :name, :string, null: false
      add :parent_account_id, references(:accounts, type: :uuid, on_delete: :nilify_all)
      add :owner_id, references(:users, type: :uuid, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:accounts, [:owner_id])
    create index(:accounts, [:parent_account_id])
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_accounts_migration");
};

const add_auth_access_control_migration = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
}: ApiAppData) => {
  const dir = join(AppDir || "", `${AppNameSnake}/priv/auth_repo/migrations`);
  const baseName = "create_access_control_tables.exs";
  let filename = `${timestamp()}_${baseName}`;

  if (existsSync(dir)) {
    const existing = readdirSync(dir).find(name => name.endsWith(baseName));
    if (existing) {
      filename = existing;
    }
  }

  const content = `defmodule ${AppNameCamel}.AuthRepo.Migrations.CreateAccessControlTables do
  use Ecto.Migration

  def change do
    create table(:access_tags, primary_key: false) do
      add :name, :string, primary_key: true
      add :desc, :text

      timestamps(type: :utc_datetime)
    end

    create table(:access_groups, primary_key: false) do
      add :name, :string, primary_key: true
      add :desc, :text

      timestamps(type: :utc_datetime)
    end

    create table(:group_tags, primary_key: false) do
      add :group_id, references(:access_groups, column: :name, type: :string, on_delete: :delete_all),
        null: false

      add :tag_id, references(:access_tags, column: :name, type: :string, on_delete: :delete_all),
        null: false

      timestamps(type: :utc_datetime)
    end

    create index(:group_tags, [:group_id])
    create unique_index(:group_tags, [:group_id, :tag_id])

    create table(:user_access, primary_key: false) do
      add :user_id, references(:users, type: :uuid, on_delete: :delete_all), null: false
      add :tag_id, references(:access_tags, column: :name, type: :string, on_delete: :delete_all), null: false
      add :group_id, references(:access_groups, column: :name, type: :string, on_delete: :nilify_all)

      timestamps(type: :utc_datetime)
    end

    create index(:user_access, [:user_id])
    create unique_index(:user_access, [:user_id, :tag_id, :group_id])

    create table(:account_access, primary_key: false) do
      add :account_id, references(:accounts, type: :uuid, on_delete: :delete_all), null: false
      add :tag_id, references(:access_tags, column: :name, type: :string, on_delete: :delete_all), null: false
      add :group_ids, {:array, :string}, null: false, default: []

      timestamps(type: :utc_datetime)
    end

    create index(:account_access, [:account_id])
    create unique_index(:account_access, [:account_id, :tag_id])
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_access_control_migration");
};

export { add_auth_migration, add_auth_oauth_tokens_migration, add_auth_oauth_states_migration, add_auth_accounts_migration, add_auth_access_control_migration };

