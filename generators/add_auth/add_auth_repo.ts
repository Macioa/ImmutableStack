import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";
import { db } from "../../utils/database";

const add_auth_repo = async ({ AppDir, AppNameSnake, AppNameCamel, Database }: ApiAppData) => {
  const { adapter } = db(Database);
  const dir = join(AppDir || "", `${AppNameSnake}/lib/${AppNameSnake}`);
  const filename = "auth_repo.ex";
  const content = `defmodule ${AppNameCamel}.AuthRepo do
  use Ecto.Repo,
    otp_app: :${AppNameSnake},
    adapter: ${adapter}
end`;

  return generateFile({ dir, filename, content }, "add_auth_repo");
};

export { add_auth_repo };

