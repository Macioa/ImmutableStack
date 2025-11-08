import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_repo = async ({ AppDir, AppNameSnake, AppNameCamel }: ApiAppData) => {
  const dir = join(AppDir || "", `${AppNameSnake}/lib/${AppNameSnake}`);
  const filename = "auth_repo.ex";
  const content = `defmodule ${AppNameCamel}.AuthRepo do
  use Ecto.Repo,
    otp_app: :${AppNameSnake},
    adapter: Ecto.Adapters.Postgres
end`;

  return generateFile({ dir, filename, content }, "add_auth_repo");
};

export { add_auth_repo };

