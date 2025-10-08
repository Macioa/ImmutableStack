import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./gen_api_endpoint";

const gen_api_application = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "application.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web`);
  const content = `defmodule ${ApiNameCamel}.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children =
      [
        ${ApiNameCamel}.Telemetry,

        ${ApiNameCamel}.Endpoint
      ]
      |> Enum.filter(&(&1 != nil))

    opts = [strategy: :one_for_one, name: ${ApiNameCamel}.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    ${ApiNameCamel}.Endpoint.config_change(changed, removed)
    :ok
  end
end`;

  return generateFile({ filename, dir, content }, "gen_api_application");
};

export { gen_api_application };

