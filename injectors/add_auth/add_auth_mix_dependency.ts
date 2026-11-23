import { join } from "@/utils/path";
import { ApiAppData } from "@/generators/add_api";
import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { format } from "@/utils/format";

const add_auth_mix_dependency = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  UmbrellaDir,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const file = join(AppDir || "", `${apiAppName}/mix.exs`);

  const corsPlugRegex = /{:cors_plug,\s*"~> 2\.0"},/;
  let content = readFileSync(file, "utf8");

  if (content.includes("{:pbkdf2_elixir")) {
    return [];
  }

  if (!corsPlugRegex.test(content)) {
    throw new Error("Failed to locate cors_plug dependency block while adding pbkdf2_elixir");
  }

  content = content.replace(
    corsPlugRegex,
    `{:pbkdf2_elixir, "~> 2.0"},\n      {:cors_plug, "~> 2.0"},`
  );

  writeFileSync(file, content, "utf8");

  execSync("mix deps.get", { cwd: UmbrellaDir, stdio: "ignore" });

  await format(file);

  return [file];
};

export { add_auth_mix_dependency };

