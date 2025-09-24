import { generateFile } from "..";
import { ImmutableGenerator } from "../../immutable_gen";
import { join } from "../../utils/path";


const gen_auth_controller = async ({AppData: {AppNameSnake, AppNameCamel, WebDir}}: ImmutableGenerator) => {
const filename = "auth_controller.ex";
const dir = join(WebDir, `lib/${AppNameSnake}_web/controllers`);
const content = `defmodule ${AppNameCamel}Web.AuthController do
  use ${AppNameCamel}Web, :controller
  plug Ueberauth

  alias ${AppNameCamel}.Accounts
  alias ${AppNameCamel}.Auth.Guardian

  def login(conn, %{"email" => email, "password" => password}) do
    with {:ok, user} <- Accounts.authenticate_user(email, password),
         {:ok, token, _claims} <- Guardian.encode_and_sign(user) do
      json(conn, %{token: token})
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid credentials"})
    end
  end

  def callback(%{assigns: %{ueberauth_auth: auth}} = conn, _params) do
    with {:ok, user} <- Accounts.get_or_create_user_from_google(auth),
         {:ok, token, _claims} <- Guardian.encode_and_sign(user) do
      redirect(conn, to: "/?token=#{token}")
    else
      _ ->
        conn
        |> put_flash(:error, "Authentication failed")
        |> redirect(to: "/")
    end
  end
end`
return generateFile({filename, dir, content})
}

export { gen_auth_controller };