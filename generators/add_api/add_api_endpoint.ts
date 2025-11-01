import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";
import crypto from "crypto";

type ApiAppData = AppData & { ApiNameSnake: string; ApiNameCamel: string; ApiPort?: number };

const add_api_endpoint = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "endpoint.ex";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${ApiNameSnake}_web`);
  const signingKey = crypto.randomBytes(8).toString("hex");
  const content = `defmodule ${ApiNameCamel}.Endpoint do
  use Phoenix.Endpoint, otp_app: :${apiAppName}

  socket("/socket", ${ApiNameCamel}.UserSocket,
    websocket: true,
    longpoll: false
  )

  @session_options [
    store: :cookie,
    key: "_${apiAppName}_key",
    signing_salt: "${signingKey}",
    same_site: "Lax"
  ]

  socket("/live", Phoenix.LiveView.Socket,
    websocket: [connect_info: [session: @session_options]],
    longpoll: [connect_info: [session: @session_options]]
  )

  plug(Plug.Static,
    at: "/",
    from: :${apiAppName},
    gzip: false,
    only: ~w(assets fonts images js css vite.svg index.html)
  )

  if code_reloading? do
    plug(Phoenix.CodeReloader)
    plug(Phoenix.Ecto.CheckRepoStatus, otp_app: :${apiAppName})
  end

  plug(Phoenix.LiveDashboard.RequestLogger,
    param_key: "request_logger",
    cookie_key: "request_logger"
  )

  plug(Plug.RequestId)
  plug(Plug.Telemetry, event_prefix: [:phoenix, :endpoint])

  plug(Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library()
  )

  plug(CORSPlug, origin: Application.compile_env(:${AppNameSnake}, CORSPlug)[:origin])
  plug(Plug.MethodOverride)
  plug(Plug.Head)
  plug(Plug.Session, @session_options)
  plug(${ApiNameCamel}.Router)
end`;

  return generateFile({ filename, dir, content }, "add_api_endpoint");
};

export { add_api_endpoint };
export type { ApiAppData };

