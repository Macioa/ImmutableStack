import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./add_api_endpoint";

const add_api_application = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "application.ex";
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}`);
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

  return generateFile({ filename, dir, content }, "add_api_application");
};

export { add_api_application };

