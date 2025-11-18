import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_oauth_adapter = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}/oauth`);
  const filename = "adapter.ex";
  const content = `defmodule ${ApiNameCamel}.OAuth.Adapter do
  @moduledoc """
  Minimal OAuth adapter for Microsoft and Google providers.
  """

  alias ${ApiNameCamel}.Accounts

  @type provider :: :google | :microsoft
  @type token_response :: {:ok, map()} | {:error, term()}

  @doc """
  Generates the OAuth authorization URL for the given provider.
  Stores state in the database for CSRF protection.
  Returns {:ok, url} on success, {:error, reason} on failure.
  """
  @spec authorization_url(provider(), String.t()) :: {:ok, String.t()} | {:error, term()}
  def authorization_url(provider, redirect_uri) when provider in [:google, :microsoft] do
    state = generate_state()

    case Accounts.create_oauth_state(provider, state) do
      {:ok, _oauth_state} ->
        url = build_authorization_url(provider, redirect_uri, state)
        {:ok, url}

      {:error, changeset} ->
        {:error, changeset}
    end
  end

  defp build_authorization_url(:google, redirect_uri, state) do
    client_id = get_config(:google, :client_id)
    scope = "openid email profile"

    "https://accounts.google.com/o/oauth2/v2/auth?" <>
      URI.encode_query(%{
        client_id: client_id,
        redirect_uri: redirect_uri,
        response_type: "code",
        scope: scope,
        state: state
      })
  end

  defp build_authorization_url(:microsoft, redirect_uri, state) do
    client_id = get_config(:microsoft, :client_id)
    scope = "openid email profile User.Read"

    "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" <>
      URI.encode_query(%{
        client_id: client_id,
        redirect_uri: redirect_uri,
        response_type: "code",
        scope: scope,
        state: state
      })
  end

  @doc """
  Validates an OAuth state for CSRF protection.
  Returns :ok if valid, :error if invalid or expired.
  The state is consumed (deleted) after validation.
  """
  @spec validate_state(String.t(), provider()) :: :ok | :error
  def validate_state(state, provider) when provider in [:google, :microsoft] do
    Accounts.validate_oauth_state(state, provider)
  end

  @doc """
  Exchanges an authorization code for an access token.
  """
  @spec exchange_code(provider(), String.t(), String.t()) :: token_response()
  def exchange_code(:google, code, redirect_uri) do
    client_id = get_config(:google, :client_id)
    client_secret = get_config(:google, :client_secret)

    body =
      URI.encode_query(%{
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
      })

    headers = [{"content-type", "application/x-www-form-urlencoded"}]

    case http_post("https://oauth2.googleapis.com/token", body, headers) do
      {:ok, %Req.Response{status: 200, body: response_body}} ->
        {:ok, decode_json_response(response_body)}

      {:ok, %Req.Response{status: status, body: response_body}} ->
        {:error, {:http_error, status, response_body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def exchange_code(:microsoft, code, redirect_uri) do
    client_id = get_config(:microsoft, :client_id)
    client_secret = get_config(:microsoft, :client_secret)

    body =
      URI.encode_query(%{
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
      })

    headers = [{"content-type", "application/x-www-form-urlencoded"}]

    case http_post("https://login.microsoftonline.com/common/oauth2/v2.0/token", body, headers) do
      {:ok, %Req.Response{status: 200, body: response_body}} ->
        {:ok, decode_json_response(response_body)}

      {:ok, %Req.Response{status: status, body: response_body}} ->
        {:error, {:http_error, status, response_body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Fetches user information from the provider using an access token.
  """
  @spec get_user_info(provider(), String.t()) :: {:ok, map()} | {:error, term()}
  def get_user_info(:google, access_token) do
    headers = [{"authorization", "Bearer #{access_token}"}]

    case http_get("https://www.googleapis.com/oauth2/v2/userinfo", headers) do
      {:ok, %Req.Response{status: 200, body: response_body}} ->
        {:ok, decode_json_response(response_body)}

      {:ok, %Req.Response{status: status, body: response_body}} ->
        {:error, {:http_error, status, response_body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  def get_user_info(:microsoft, access_token) do
    headers = [{"authorization", "Bearer #{access_token}"}]

    case http_get("https://graph.microsoft.com/v1.0/me", headers) do
      {:ok, %Req.Response{status: 200, body: response_body}} ->
        user_data = decode_json_response(response_body)
        {:ok, normalize_microsoft_user(user_data)}

      {:ok, %Req.Response{status: status, body: response_body}} ->
        {:error, {:http_error, status, response_body}}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp normalize_microsoft_user(%{"mail" => email, "displayName" => name} = data) do
    %{
      "email" => email,
      "name" => name,
      "id" => Map.get(data, "id", ""),
      "picture" => Map.get(data, "photo", nil)
    }
  end

  defp normalize_microsoft_user(%{"userPrincipalName" => email, "displayName" => name} = data) do
    %{
      "email" => email,
      "name" => name,
      "id" => Map.get(data, "id", ""),
      "picture" => Map.get(data, "photo", nil)
    }
  end

  defp normalize_microsoft_user(data) do
    %{
      "email" => Map.get(data, "mail") || Map.get(data, "userPrincipalName") || "",
      "name" => Map.get(data, "displayName") || "",
      "id" => Map.get(data, "id", ""),
      "picture" => Map.get(data, "photo", nil)
    }
  end

  defp get_config(provider, key) do
    Application.get_env(:${apiAppName}, :oauth, [])
    |> Keyword.get(provider, [])
    |> Keyword.get(key, "")
  end

  defp generate_state do
    :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
  end

  defp http_post(url, body, headers) do
    case Req.post(url, body: body, headers: headers) do
      {:ok, %Req.Response{} = response} ->
        {:ok, response}

      {:error, reason} ->
        {:error, reason}
    end
  end

  defp http_get(url, headers) do
    case Req.get(url, headers: headers) do
      {:ok, %Req.Response{} = response} ->
        {:ok, response}

      {:error, reason} ->
        {:error, reason}
    end
  end

  # Req automatically decodes JSON responses, so check if body is already decoded
  defp decode_json_response(response_body) when is_map(response_body) do
    response_body
  end

  defp decode_json_response(response_body) when is_binary(response_body) do
    Jason.decode!(response_body)
  end

  defp decode_json_response(response_body) do
    # Fallback: try to decode anyway
    Jason.decode!(response_body)
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_adapter");
};

export { add_auth_oauth_adapter };


