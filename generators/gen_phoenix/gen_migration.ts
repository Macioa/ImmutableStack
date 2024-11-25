import { exec } from "child_process";
import { readFile, writeFile } from "fs/promises";

const updateMigration = (
  path: string,
  generator: any,
  typeDict: any
): Promise<boolean> => {
  const source = (typeDict.DatabaseModel || typeDict.ImmutableGlobal)["ex"];
  const nameStr = generator.generate.databaseModel;
  const addStr = Object.keys(source)
    .map((k) => `add :${k}, :${source[k]}`)
    .join("\n");

  return new Promise(async (resolve, reject) => {
    if (!path) reject(false);
    try {
      const migrationFile = await readFile(path as string, "utf-8");
      const updatedFile = migrationFile.replace(
        /def\s+change\s+do\s*\n{0,10}\s*end/g,
        (_) => {
          const updatedContent = `
  def up do
    create table(:${nameStr}) do
      ${addStr}

      timestamps()
    end
  end

  def down do
    drop table(:${nameStr})
  end`;
          return updatedContent;
        }
      );

      await writeFile(path as string, updatedFile, "utf-8");
      resolve(true);
    } catch (error) {
      console.log("Could not update migration: ", error);
      reject(new Error(`Could not update migration: ${error}`));
    }
  });
};

const createMigrationFile = (generator: any): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    try {
      let command = `mix ecto.gen.migration create_${generator.generate.databaseModel}`;

      exec(command, (err, stdout, stderr) => {
        const match = stdout.match(/\* creating (.+\.exs)/);

        if (match && match[1] && !err && !stderr) {
          resolve(match[1]);
          console.log(`Migration created at ${match[1]}`);
        } else {
          console.error(`Error creating migration: ${err || stderr}`);
          reject(new Error(`Error creating migration: ${err || stderr}`));
        }
      });
    } catch (error) {
      console.error(error);
      reject(new Error(error as string));
    }
  });
};

const createMigration = async (generator: any, typeDict: any) => {
  const path = await createMigrationFile(generator);
  await updateMigration(path || "", generator, typeDict);
  exec(`mix format ${path}`);
};

export { createMigration };
