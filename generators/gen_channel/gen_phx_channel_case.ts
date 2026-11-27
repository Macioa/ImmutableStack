import { join } from "@/utils/path";
import { AppData } from "@/readers/get_app_data";
import { generateFile } from "@/generators/index";

const gen_phx_channel_case = ({ WebDir, AppNameCamel }: AppData) => {
  const filename = "channel_case.ex";
  const dir = join(WebDir, "test/support");
  const content = `defmodule ${AppNameCamel}Web.ChannelCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      import Phoenix.ChannelTest
      import ${AppNameCamel}Web.ChannelCase

      @endpoint ${AppNameCamel}Web.Endpoint
    end
  end

  setup tags do
    pid = Ecto.Adapters.SQL.Sandbox.start_owner!(${AppNameCamel}.Repo, shared: not tags[:async])
    on_exit(fn -> Ecto.Adapters.SQL.Sandbox.stop_owner(pid) end)
    :ok
  end
end
`;
  return generateFile({ filename, dir, content }, "gen_phx_channel_case");
};

export { gen_phx_channel_case };
