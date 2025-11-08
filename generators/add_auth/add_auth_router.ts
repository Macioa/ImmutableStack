import { join } from "../../utils/path";
import { generateFile } from "..";
import { mark, CommentType } from "../../repair";
import { ApiAppData } from "../add_api";

const add_auth_router = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}`);
  const filename = "router.ex";
  const routerContent = `defmodule ${ApiNameCamel}.Router do
  use ${ApiNameCamel}, :router

  import ${ApiNameCamel}.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  scope "/", ${ApiNameCamel} do
    pipe_through :browser

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
      pipe_through(:browser)

      live_dashboard("/dashboard", metrics: ${ApiNameCamel}.Telemetry)
      forward("/mailbox", Plug.Swoosh.MailboxPreview)
    end
  end

  ## Authentication routes

  scope "/", ${ApiNameCamel} do
    pipe_through [:browser, :redirect_if_user_is_authenticated]

    get "/users/register", UserRegistrationController, :new
    post "/users/register", UserRegistrationController, :create
    get "/users/log_in", UserSessionController, :new
    post "/users/log_in", UserSessionController, :create
    get "/users/reset_password", UserResetPasswordController, :new
    post "/users/reset_password", UserResetPasswordController, :create
    get "/users/reset_password/:token", UserResetPasswordController, :edit
    put "/users/reset_password/:token", UserResetPasswordController, :update
  end

  scope "/", ${ApiNameCamel} do
    pipe_through [:browser, :require_authenticated_user]

    get "/users/settings", UserSettingsController, :edit
    put "/users/settings", UserSettingsController, :update
    get "/users/settings/confirm_email/:token", UserSettingsController, :confirm_email
  end

  scope "/", ${ApiNameCamel} do
    pipe_through [:browser]

    delete "/users/log_out", UserSessionController, :delete
    get "/users/confirm", UserConfirmationController, :new
    post "/users/confirm", UserConfirmationController, :create
    get "/users/confirm/:token", UserConfirmationController, :edit
    post "/users/confirm/:token", UserConfirmationController, :update
  end
end`;

  const content = mark({ str: routerContent, type: "ROUTER" }, "EX" as CommentType);

  return generateFile({ dir, filename, content }, "add_auth_router");
};

export { add_auth_router };



