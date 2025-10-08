import { join } from "../../utils/path";
import { generateFile } from "..";
import { mark, CommentType } from "../../repair";
import { ApiAppData } from "./gen_api_endpoint";

const gen_api_router = async ({ AppDir, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "router.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web`);
  const routerContent = `defmodule ${ApiNameCamel}.Router do
  use ${ApiNameCamel}, :router

  scope "/", ${ApiNameCamel} do
    get("/nodes", StatusController, :index)
    get("/", PageController, :index)
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/api", ${ApiNameCamel} do
    pipe_through(:api)
  end

  if Application.compile_env(:${apiAppName}, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through([:fetch_session, :protect_from_forgery])

      live_dashboard("/dashboard", metrics: ${ApiNameCamel}.Telemetry)
      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end
end`;
  
  const content = mark({ str: routerContent, type: "ROUTER" }, "EX" as CommentType);

  return generateFile({ filename, dir, content }, "gen_api_router");
};

export { gen_api_router };

