import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_api_auth_plug = async ({ WebDir, AppNameSnake, AppNameCamel, ApiNameCamel }: ApiAppData) => {
  const dir = join(WebDir || "", `lib/${AppNameSnake}_web/plugs`);
  const content = `defmodule ${AppNameCamel}Web.Plugs.ApiAuth do
  @moduledoc """
  Requires a bearer token issued by the auth app. Every node checks the
  shared database, so a token from one node works on all of them.
  """
  @behaviour Plug

  import Plug.Conn
  import Phoenix.Controller, only: [json: 2]

  alias ${ApiNameCamel}.Accounts

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    case conn |> get_req_header("authorization") |> bearer() |> user_from_token() do
      nil -> conn |> put_status(:unauthorized) |> json(%{error: "Not authenticated"}) |> halt()
      user -> assign(conn, :current_user, user)
    end
  end

  @doc "Returns the user for an encoded session token, or nil."
  def user_from_token(encoded) when is_binary(encoded) do
    case Base.url_decode64(encoded) do
      {:ok, token} -> Accounts.get_user_by_session_token(token)
      :error -> nil
    end
  end

  def user_from_token(_encoded), do: nil

  defp bearer(["Bearer " <> encoded]), do: encoded
  defp bearer(_headers), do: nil
end
`;

  return generateFile({ filename: "api_auth.ex", dir, content }, "add_auth_api_auth_plug");
};

export { add_auth_api_auth_plug };
