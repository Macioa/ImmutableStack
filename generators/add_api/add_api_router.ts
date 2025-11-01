import { join } from "../../utils/path";
import { generateFile } from "..";
import { mark, CommentType } from "../../repair";
import { ApiAppData } from "./add_api_endpoint";

const add_api_router = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "router.ex";
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}`);
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

  return generateFile({ filename, dir, content }, "add_api_router");
};

export { add_api_router };

