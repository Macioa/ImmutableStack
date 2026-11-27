import { join } from "../../utils/path";
import { generateFile } from "..";
import { mark, CommentType } from "../../repair";
import { ApiAppData } from "../add_api";

const add_auth_router = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}`);
  const filename = "router.ex";
  const routerContent = `# ** IMMUTABLE  ROUTER b12c9b12-eb42-4f84-88b7-90bae1609733 **
defmodule ${ApiNameCamel}.Router do
  use ${ApiNameCamel}, :router

  import ${ApiNameCamel}.UserAuth

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug Plug.CSRFProtection
    plug :put_secure_browser_headers
    plug :fetch_current_user
  end

  scope "/", ${ApiNameCamel} do
    pipe_through :browser

    get("/nodes", StatusController, :index)
    get("/", PageController, :index)
  end

  import Ithibati.Web.Router

  # Passkey sign-up and sign-in keep their challenge in the session cookie between the two requests.
  pipeline :webauthn_ceremony do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:fetch_current_user)
  end

  scope "/auth" do
    pipe_through(:webauthn_ceremony)
    ithibati_routes(handler: ${ApiNameCamel}.Passkeys, rp_name: "${AppNameCamel}")
    get("/setup", ${ApiNameCamel}.SetupJSONController, :show)
    post("/setup", ${ApiNameCamel}.SetupJSONController, :create)
  end

  pipeline :api do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:fetch_current_user)
  end

  pipeline :api_authenticated do
    plug(:accepts, ["json"])
    plug(:fetch_session)
    plug(:fetch_current_user)
    plug(:require_authenticated_user_api)
  end

  scope "/api", ${ApiNameCamel} do
    pipe_through(:api)

    post("/users/log_in", UserSessionJSONController, :create)
    post("/users/register", UserRegistrationJSONController, :create)
    get("/oauth/providers", OAuthController, :providers)
    delete("/users/log_out", UserSessionJSONController, :delete)
  end

  scope "/api", ${ApiNameCamel} do
    pipe_through(:api_authenticated)

    get("/users/settings", UserSettingsJSONController, :show)
    put("/users/settings", UserSettingsJSONController, :update)
    delete("/users/sessions", UserSessionJSONController, :delete_all)
    get("/users/passkeys", PasskeyJSONController, :index)
    get("/users/recovery_codes", RecoveryCodeJSONController, :show)
    post("/users/recovery_codes", RecoveryCodeJSONController, :create)
    put("/users/passkeys/:id", PasskeyJSONController, :update)
    delete("/users/passkeys/:id", PasskeyJSONController, :delete)
  end

  pipeline :invitations do
    plug(${ApiNameCamel}.Plugs.RequireAccess, ["invitations"])
  end

  scope "/api", ${ApiNameCamel} do
    pipe_through([:api_authenticated, :invitations])

    get("/invitations", InvitationJSONController, :index)
    post("/invitations", InvitationJSONController, :create)
    delete("/invitations/:id", InvitationJSONController, :delete)
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

  ## OAuth routes

  scope "/", ${ApiNameCamel} do
    pipe_through(:browser)

    get("/oauth/:provider", OAuthController, :initiate)
    get("/oauth/:provider/callback", OAuthController, :callback)
  end
end
# ** IMMUTABLE  ROUTER b12c9b12-eb42-4f84-88b7-90bae1609733 **
`;

  const content = mark({ str: routerContent, type: "ROUTER" }, "EX" as CommentType);

  return generateFile({ dir, filename, content }, "add_auth_router");
};

export { add_auth_router };






