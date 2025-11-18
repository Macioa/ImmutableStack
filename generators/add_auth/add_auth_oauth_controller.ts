import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_oauth_controller = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`);
  const filename = "oauth_controller.ex";
  const content = `defmodule ${ApiNameCamel}.OAuthController do
  use ${ApiNameCamel}, :controller

  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.OAuth.Adapter
  alias ${ApiNameCamel}.UserAuth

  require Logger

  @doc """
  Initiates OAuth flow by redirecting to provider's authorization URL.
  Accepts optional \`redirect_to\` query parameter to redirect back after successful auth.
  """
  def initiate(conn, %{"provider" => provider}) when provider in ["google", "microsoft"] do
    provider_atom = String.to_atom(provider)
    redirect_uri = oauth_callback_url(provider)
    redirect_to = conn.params["redirect_to"] || conn.query_params["redirect_to"]
    is_popup = conn.params["popup"] == "true" || conn.query_params["popup"] == "true"

    conn =
      conn
      |> maybe_put_session(:oauth_redirect_to, redirect_to)
      |> maybe_put_session(:oauth_popup, is_popup && true)

    case Adapter.authorization_url(provider_atom, redirect_uri) do
      {:ok, url} ->
        if is_popup do
          conn
          |> put_resp_content_type("text/html")
          |> send_resp(200, """
          <!DOCTYPE html>
          <html>
          <head>
            <title>Redirecting...</title>
            <meta http-equiv="refresh" content="0;url=#{url}">
            <script>
              (function() {
                try {
                  window.name = "oauth_popup";
                  try {
                    sessionStorage.setItem("oauth_popup", "true");
                  } catch(e) {}
                  window.location.replace(#{inspect(url)});
                } catch(e) {
                  window.location.href = #{inspect(url)};
                }
              })();
            </script>
          </head>
          <body>
            <p>Redirecting to #{provider}...</p>
            <noscript>
              <meta http-equiv="refresh" content="0;url=#{url}">
            </noscript>
          </body>
          </html>
          """)
        else
          redirect(conn, external: url)
        end

      {:error, _changeset} ->
        conn
        |> put_flash(:error, "Failed to initiate OAuth flow")
        |> redirect(to: ~p"/users/log_in")
    end
  end

  def initiate(conn, _params) do
    conn
    |> put_flash(:error, "Invalid OAuth provider")
    |> redirect(to: ~p"/users/log_in")
  end

  @doc """
  Handles OAuth callback from provider.
  Validates state, exchanges code for token, and creates/updates user.
  """
  def callback(conn, %{"provider" => provider, "code" => code, "state" => state})
      when provider in ["google", "microsoft"] do
    provider_atom = String.to_atom(provider)
    redirect_uri = oauth_callback_url(provider)

    is_popup =
      get_session(conn, :oauth_popup) == true ||
      conn.params["popup"] == "true" ||
      conn.query_params["popup"] == "true"

    result =
      with :ok <- Adapter.validate_state(state, provider_atom) |> log_step("validate_state"),
           {:ok, token_data} <- Adapter.exchange_code(provider_atom, code, redirect_uri) |> log_step("exchange_code"),
           {:ok, user_info} <- Adapter.get_user_info(provider_atom, token_data["access_token"]) |> log_step("get_user_info"),
           {:ok, user} <- get_or_create_user(provider_atom, user_info) |> log_step("get_or_create_user"),
           {:ok, _oauth_token} <- store_oauth_token(user, provider_atom, token_data, user_info) |> log_step("store_oauth_token") do
        {:ok, user}
      else
        :error ->
          Logger.error("OAuth callback failed: Invalid or expired OAuth state")
          {:error, "Invalid or expired OAuth state"}

        {:error, reason} ->
          Logger.error("OAuth callback failed: #{inspect(reason)}")
          {:error, reason}
      end

    case result do
      {:ok, user} ->
        redirect_to = get_session(conn, :oauth_redirect_to)

        conn =
          conn
          |> put_flash(:info, "Successfully authenticated with #{provider}")
          |> assign(:oauth_redirect_to, redirect_to)
          |> assign(:oauth_is_popup, is_popup)
          |> maybe_put_session(:user_return_to, redirect_to)
          |> maybe_put_session(:oauth_popup, is_popup && true)

        conn = UserAuth.log_in_user_json(conn, user, %{})

        redirect_to = conn.assigns[:oauth_redirect_to]
        is_popup = conn.assigns[:oauth_is_popup] || false

        conn =
          conn
          |> maybe_put_session(:oauth_popup, is_popup && true)
          |> maybe_put_session(:user_return_to, redirect_to)

        is_popup_final =
          is_popup ||
          get_session(conn, :oauth_popup) == true ||
          conn.params["popup"] == "true" ||
          conn.query_params["popup"] == "true" ||
          (redirect_to && String.contains?(redirect_to, "localhost:5173"))

        if is_popup_final do
          ui_origin = if redirect_to do
            uri = URI.parse(redirect_to)
            "#{uri.scheme}://#{uri.host}#{if uri.port, do: ":#{uri.port}", else: ""}"
          else
            ${ApiNameCamel}.Endpoint.url()
          end

          conn
          |> put_resp_content_type("text/html")
          |> send_resp(200, """
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Successful</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 {
                color: #28a745;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✓ Authentication Successful</h1>
              <p>Closing window...</p>
            </div>
            <script>
              (function() {
                window.name = "oauth_popup";
                try {
                  sessionStorage.setItem("oauth_popup", "true");
                } catch(e) {}

                var targetOrigin = "#{ui_origin}";
                var authApiUrl = "#{${ApiNameCamel}.Endpoint.url()}/api";

                fetch(authApiUrl + "/users/settings", {
                  method: "GET",
                  credentials: "include",
                  headers: {
                    "Content-Type": "application/json"
                  }
                })
                .then(function(response) {
                  if (!response.ok) {
                    throw new Error("Failed to fetch user: " + response.status);
                  }
                  return response.json();
                })
                .then(function(data) {
                  var messageSent = false;
                  var messageData = {
                    type: "oauth_success",
                    userData: data
                  };

                  try {
                    if (window.opener && !window.opener.closed) {
                      window.opener.postMessage(messageData, targetOrigin);
                      messageSent = true;
                    } else if (window.opener === null) {
                      try {
                        window.opener.postMessage(messageData, targetOrigin);
                        messageSent = true;
                      } catch (e) {}
                    }
                  } catch (e) {}

                  if (!messageSent && window.opener) {
                    try {
                      window.opener.postMessage(messageData, "*");
                      messageSent = true;
                    } catch (e) {
                      try {
                        for (var i = 0; i < window.length; i++) {
                          try {
                            var win = window[i];
                            if (win && win !== window && win.location && win.location.origin === targetOrigin) {
                              win.postMessage(messageData, "*");
                              messageSent = true;
                              break;
                            }
                          } catch (e) {}
                        }
                      } catch (e) {}
                    }
                  }

                  if (!messageSent && window.parent && window.parent !== window) {
                    try {
                      window.parent.postMessage(messageData, targetOrigin);
                      messageSent = true;
                    } catch (e) {}
                  }

                  if (!messageSent && window.top && window.top !== window) {
                    try {
                      window.top.postMessage(messageData, targetOrigin);
                      messageSent = true;
                    } catch (e) {}
                  }

                  if (!messageSent) {
                    var openerRef = null;
                    try {
                      if (window.opener && !window.opener.closed) {
                        openerRef = window.opener;
                      } else if (window.top && window.top.opener && !window.top.opener.closed) {
                        openerRef = window.top.opener;
                      }
                    } catch (e) {}

                    if (openerRef) {
                      var encodedData = encodeURIComponent(JSON.stringify(messageData));
                      var redirectUrl = targetOrigin + "/ui/?oauth_success=" + encodedData;
                      try {
                        openerRef.location.href = redirectUrl;
                        messageSent = true;
                      } catch (e) {
                        try {
                          openerRef.location.replace(redirectUrl);
                          messageSent = true;
                        } catch (e2) {}
                      }
                    } else {
                      try {
                        var channel = new BroadcastChannel('oauth_success');
                        channel.postMessage(messageData);
                        channel.close();
                        messageSent = true;
                      } catch (e) {}
                    }
                  }

                  setTimeout(function() {
                    if (!messageSent && window.opener && !window.opener.closed) {
                      try {
                        var encodedData = encodeURIComponent(JSON.stringify(messageData));
                        var redirectUrl = targetOrigin + "/ui/?oauth_success=" + encodedData;
                        window.opener.location.href = redirectUrl;
                        messageSent = true;
                      } catch (e) {}
                    }

                    if (messageSent) {
                      setTimeout(function() {
                        try {
                          window.close();
                        } catch (e) {}
                      }, 500);
                    } else {
                      try {
                        window.close();
                      } catch (e) {}
                    }
                  }, 2000);
                })
                .catch(function(error) {
                  var errorMessage = {
                    type: "oauth_success",
                    userData: null,
                    error: "Failed to fetch user data: " + error.message
                  };

                  if (window.opener && !window.opener.closed) {
                    try {
                      window.opener.postMessage(errorMessage, targetOrigin);
                    } catch (e) {}
                  }

                  setTimeout(function() {
                    try {
                      window.close();
                    } catch (e) {}
                  }, 500);
                });
              })();
            </script>
          </body>
          </html>
          """)
        else
          redirect_to = get_session(conn, :user_return_to) ||
                        get_session(conn, :oauth_redirect_to) ||
                        conn.params["redirect_to"] ||
                        conn.query_params["redirect_to"]

          if redirect_to do
            if String.starts_with?(redirect_to, "http://") or String.starts_with?(redirect_to, "https://") do
              redirect(conn, external: redirect_to)
            else
              redirect(conn, to: redirect_to)
            end
          else
            redirect(conn, to: ~p"/")
          end
        end

      {:error, reason} ->
        if is_popup do
          conn
          |> put_resp_content_type("text/html")
          |> send_resp(200, """
          <!DOCTYPE html>
          <html>
          <head>
            <title>Authentication Failed</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              h1 {
                color: #dc3545;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✗ Authentication Failed</h1>
              <p>#{inspect(reason)}</p>
              <p>You can close this window now.</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage("oauth_error", "#{${ApiNameCamel}.Endpoint.url()}");
                setTimeout(function() {
                  window.close();
                }, 2000);
              } else {
                setTimeout(function() {
                  window.close();
                }, 3000);
              }
            </script>
          </body>
          </html>
          """)
        else
          redirect_to = get_session(conn, :oauth_redirect_to)
          error_redirect = if redirect_to, do: redirect_to, else: ~p"/users/log_in"

          conn
          |> put_flash(:error, "OAuth authentication failed: #{inspect(reason)}")
          |> redirect(to: error_redirect)
        end
    end
  end

  def callback(conn, %{"error" => error}) do
    conn
    |> put_flash(:error, "OAuth error: #{error}")
    |> redirect(to: ~p"/users/log_in")
  end

  def callback(conn, _params) do
    conn
    |> put_flash(:error, "Missing OAuth parameters")
    |> redirect(to: ~p"/users/log_in")
  end

  defp maybe_put_session(conn, _key, nil), do: conn
  defp maybe_put_session(conn, _key, false), do: conn
  defp maybe_put_session(conn, key, value) when is_binary(value), do: put_session(conn, key, value)
  defp maybe_put_session(conn, key, true), do: put_session(conn, key, true)
  defp maybe_put_session(conn, _key, _value), do: conn

  defp log_step({:ok, result}, step_name) do
    Logger.debug("OAuth step '#{step_name}' succeeded")
    {:ok, result}
  end

  defp log_step({:error, reason}, step_name) do
    Logger.error("OAuth step '#{step_name}' failed: #{inspect(reason)}")
    {:error, reason}
  end

  defp log_step(:ok, step_name) do
    Logger.debug("OAuth step '#{step_name}' succeeded")
    :ok
  end

  defp log_step(:error, step_name) do
    Logger.error("OAuth step '#{step_name}' failed")
    :error
  end

  defp get_or_create_user(provider, user_info) do
    provider_user_id = user_info["id"] || user_info["sub"] || ""

    if provider_user_id == "" do
      Logger.error("OAuth user info missing provider_user_id: #{inspect(user_info)}")
      {:error, "Provider user ID not provided by OAuth provider"}
    else
      # First, try to find user by provider + provider_user_id
      case Accounts.get_user_by_oauth_provider(provider, provider_user_id) do
        nil ->
          # User doesn't exist for this provider, check if user exists by email
          email = user_info["email"] || ""

          if email == "" do
            Logger.error("OAuth user info missing email: #{inspect(user_info)}")
            {:error, "Email not provided by OAuth provider"}
          else
            # Create unique email by appending provider: user@example.com -> user+provider@example.com
            unique_email = make_provider_unique_email(email, provider)

            # Check if user with this email already exists
            case Accounts.get_user_by_email(unique_email) do
              nil ->
                # User doesn't exist, create a new account
                Accounts.register_user(%{
                  email: unique_email,
                  password: generate_random_password()
                })

              existing_user ->
                # User exists but doesn't have OAuth token for this provider yet
                # Return the existing user - the OAuth token will be linked in store_oauth_token
                {:ok, existing_user}
            end
          end

        user ->
          # User exists for this provider, return it
          {:ok, user}
      end
    end
  end

  defp make_provider_unique_email(email, provider) do
    provider_string = Atom.to_string(provider)
    case String.split(email, "@") do
      [local_part, domain] -> "#{local_part}+#{provider_string}@#{domain}"
      _ -> "#{email}+#{provider_string}"
    end
  end

  defp store_oauth_token(user, provider, token_data, user_info) do
    expires_at =
      case token_data["expires_in"] do
        nil -> nil
        expires_in -> DateTime.utc_now() |> DateTime.add(expires_in, :second) |> DateTime.truncate(:second)
      end

    provider_user_id = user_info["id"] || user_info["sub"] || ""

    attrs = %{
      access_token: token_data["access_token"],
      refresh_token: token_data["refresh_token"],
      expires_at: expires_at,
      provider_user_id: provider_user_id
    }

    Accounts.upsert_oauth_token(user, provider, attrs)
  end

  defp oauth_callback_url(provider, params \\\\ %{}) do
    base_url = "#{${ApiNameCamel}.Endpoint.url()}/oauth/#{provider}/callback"
    if map_size(params) > 0 do
      "#{base_url}?#{URI.encode_query(params)}"
    else
      base_url
    end
  end

  defp generate_random_password do
    :crypto.strong_rand_bytes(32) |> Base.encode64()
  end
end`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_controller");
};

export { add_auth_oauth_controller };


