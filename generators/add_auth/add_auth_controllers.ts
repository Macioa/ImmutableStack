import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const buildControllersDir = (AppDir: string | undefined, AppNameSnake: string, ApiNameSnake: string) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  return join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`);
};

const add_auth_user_confirmation_controller = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const dir = buildControllersDir(AppDir, AppNameSnake, ApiNameSnake);
  const filename = "user_confirmation_controller.ex";
  const content = `defmodule ${ApiNameCamel}.UserConfirmationController do
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts

  def new(conn, _params) do
    render(conn, :new)
  end

  def create(conn, %{"user" => %{"email" => email}}) do
    if user = Accounts.get_user_by_email(email) do
      Accounts.deliver_user_confirmation_instructions(
        user,
        &url(~p"/users/confirm/#{&1}")
      )
    end

    conn
    |> put_flash(
      :info,
      "If your email is in our system and it has not been confirmed yet, " <>
        "you will receive an email with instructions shortly."
    )
    |> redirect(to: ~p"/")
  end

  def edit(conn, %{"token" => token}) do
    render(conn, :edit, token: token)
  end

  # Do not log in the user after confirmation to avoid a
  # leaked token giving the user access to the account.
  def update(conn, %{"token" => token}) do
    case Accounts.confirm_user(token) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "User confirmed successfully.")
        |> redirect(to: ~p"/")

      :error ->
        # If there is a current user and the account was already confirmed,
        # then odds are that the confirmation link was already visited, either
        # by some automation or by the user themselves, so we redirect without
        # a warning message.
        case conn.assigns do
          %{current_user: %{confirmed_at: confirmed_at}} when not is_nil(confirmed_at) ->
            redirect(conn, to: ~p"/")

          %{} ->
            conn
            |> put_flash(:error, "User confirmation link is invalid or it has expired.")
            |> redirect(to: ~p"/")
        end
    end
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_user_confirmation_controller");
};

const add_auth_user_registration_controller = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const dir = buildControllersDir(AppDir, AppNameSnake, ApiNameSnake);
  const filename = "user_registration_controller.ex";
  const content = `defmodule ${ApiNameCamel}.UserRegistrationController do
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.Accounts.User
  alias ${ApiNameCamel}.UserAuth

  def new(conn, _params) do
    changeset = Accounts.change_user_registration(%User{})
    render(conn, :new, changeset: changeset)
  end

  def create(conn, %{"user" => user_params}) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        {:ok, _} =
          Accounts.deliver_user_confirmation_instructions(
            user,
            &url(~p"/users/confirm/#{&1}")
          )

        conn
        |> put_flash(:info, "User created successfully.")
        |> UserAuth.log_in_user(user)

      {:error, %Ecto.Changeset{} = changeset} ->
        render(conn, :new, changeset: changeset)
    end
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_user_registration_controller");
};

const add_auth_user_reset_password_controller = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const dir = buildControllersDir(AppDir, AppNameSnake, ApiNameSnake);
  const filename = "user_reset_password_controller.ex";
  const content = `defmodule ${ApiNameCamel}.UserResetPasswordController do
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts

  plug :get_user_by_reset_password_token when action in [:edit, :update]

  def new(conn, _params) do
    render(conn, :new)
  end

  def create(conn, %{"user" => %{"email" => email}}) do
    if user = Accounts.get_user_by_email(email) do
      Accounts.deliver_user_reset_password_instructions(
        user,
        &url(~p"/users/reset_password/#{&1}")
      )
    end

    conn
    |> put_flash(
      :info,
      "If your email is in our system, you will receive instructions to reset your password shortly."
    )
    |> redirect(to: ~p"/")
  end

  def edit(conn, _params) do
    render(conn, :edit, changeset: Accounts.change_user_password(conn.assigns.user))
  end

  # Do not log in the user after reset password to avoid a
  # leaked token giving the user access to the account.
  def update(conn, %{"user" => user_params}) do
    case Accounts.reset_user_password(conn.assigns.user, user_params) do
      {:ok, _} ->
        conn
        |> put_flash(:info, "Password reset successfully.")
        |> redirect(to: ~p"/users/log_in")

      {:error, changeset} ->
        render(conn, :edit, changeset: changeset)
    end
  end

  defp get_user_by_reset_password_token(conn, _opts) do
    %{"token" => token} = conn.params

    if user = Accounts.get_user_by_reset_password_token(token) do
      conn |> assign(:user, user) |> assign(:token, token)
    else
      conn
      |> put_flash(:error, "Reset password link is invalid or it has expired.")
      |> redirect(to: ~p"/")
      |> halt()
    end
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_user_reset_password_controller");
};

const add_auth_user_session_controller = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const dir = buildControllersDir(AppDir, AppNameSnake, ApiNameSnake);
  const filename = "user_session_controller.ex";
  const content = `defmodule ${ApiNameCamel}.UserSessionController do
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.UserAuth

  def new(conn, _params) do
    render(conn, :new, error_message: nil)
  end

  def create(conn, %{"user" => user_params}) do
    %{"email" => email, "password" => password} = user_params

    if user = Accounts.get_user_by_email_and_password(email, password) do
      conn
      |> put_flash(:info, "Welcome back!")
      |> UserAuth.log_in_user(user, user_params)
    else
      # In order to prevent user enumeration attacks, don't disclose whether the email is registered.
      render(conn, :new, error_message: "Invalid email or password")
    end
  end

  def delete(conn, _params) do
    conn
    |> put_flash(:info, "Logged out successfully.")
    |> UserAuth.log_out_user()
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_user_session_controller");
};

const add_auth_user_settings_controller = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const dir = buildControllersDir(AppDir, AppNameSnake, ApiNameSnake);
  const filename = "user_settings_controller.ex";
  const content = `defmodule ${ApiNameCamel}.UserSettingsController do
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.UserAuth

  plug :assign_email_and_password_changesets

  def edit(conn, _params) do
    render(conn, :edit)
  end

  def update(conn, %{"action" => "update_email"} = params) do
    %{"current_password" => password, "user" => user_params} = params
    user = conn.assigns.current_user

    case Accounts.apply_user_email(user, password, user_params) do
      {:ok, applied_user} ->
        Accounts.deliver_user_update_email_instructions(
          applied_user,
          user.email,
          &url(~p"/users/settings/confirm_email/#{&1}")
        )

        conn
        |> put_flash(
          :info,
          "A link to confirm your email change has been sent to the new address."
        )
        |> redirect(to: ~p"/users/settings")

      {:error, changeset} ->
        render(conn, :edit, email_changeset: changeset)
    end
  end

  def update(conn, %{"action" => "update_password"} = params) do
    %{"current_password" => password, "user" => user_params} = params
    user = conn.assigns.current_user

    case Accounts.update_user_password(user, password, user_params) do
      {:ok, user} ->
        conn
        |> put_flash(:info, "Password updated successfully.")
        |> put_session(:user_return_to, ~p"/users/settings")
        |> UserAuth.log_in_user(user)

      {:error, changeset} ->
        render(conn, :edit, password_changeset: changeset)
    end
  end

  def confirm_email(conn, %{"token" => token}) do
    case Accounts.update_user_email(conn.assigns.current_user, token) do
      :ok ->
        conn
        |> put_flash(:info, "Email changed successfully.")
        |> redirect(to: ~p"/users/settings")

      :error ->
        conn
        |> put_flash(:error, "Email change link is invalid or it has expired.")
        |> redirect(to: ~p"/users/settings")
    end
  end

  defp assign_email_and_password_changesets(conn, _opts) do
    user = conn.assigns.current_user

    conn
    |> assign(:email_changeset, Accounts.change_user_email(user))
    |> assign(:password_changeset, Accounts.change_user_password(user))
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_user_settings_controller");
};

export {
  add_auth_user_confirmation_controller,
  add_auth_user_registration_controller,
  add_auth_user_reset_password_controller,
  add_auth_user_session_controller,
  add_auth_user_settings_controller,
};


