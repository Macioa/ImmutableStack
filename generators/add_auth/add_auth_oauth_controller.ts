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

  alias ${ApiNameCamel}.Accounts.OAuthAccounts
  alias ${ApiNameCamel}.OAuth.Adapter
  alias ${ApiNameCamel}.UserAuth

  require Logger

  @doc """
  Lists the providers whose keys are configured, so the UI only shows those buttons.
  """
  def providers(conn, _params), do: json(conn, %{data: Adapter.public_providers()})

  @doc """
  Initiates OAuth flow by redirecting to provider's authorization URL.
  Accepts optional \`redirect_to\` query parameter to redirect back after successful auth.
  Providers without keys are refused, as if they did not exist.
  """
  def initiate(conn, %{"provider" => provider}) do
    case Adapter.fetch_provider(provider) do
      {:ok, spec} -> initiate_flow(conn, spec)
      {:error, :provider_not_configured} -> provider_unavailable(conn)
    end
  end

  def initiate(conn, _params), do: provider_unavailable(conn)

  defp initiate_flow(conn, spec) do
    provider = to_string(spec.name)
    redirect_uri = oauth_callback_url(provider)
    redirect_to = conn.params["redirect_to"] || conn.query_params["redirect_to"]
    is_popup = conn.params["popup"] == "true" || conn.query_params["popup"] == "true"

    conn =
      conn
      |> maybe_put_session(:oauth_redirect_to, redirect_to)
      |> maybe_put_session(:oauth_popup, is_popup && true)
      |> put_session(:oauth_link, conn.params["link"])

    case Adapter.authorization_url(spec, redirect_uri) do
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
            <p>Redirecting to #{spec.label}...</p>
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

  defp provider_unavailable(conn) do
    conn
    |> put_flash(:error, "This sign in provider is not available")
    |> redirect(to: ~p"/users/log_in")
  end

  @doc """
  Handles OAuth callback from provider.
  Validates state, exchanges code for token, and creates/updates user.
  """
  def callback(conn, %{"provider" => provider, "code" => code, "state" => state}) do
    case Adapter.fetch_provider(provider) do
      {:ok, spec} -> complete_flow(conn, spec, code, state)
      {:error, :provider_not_configured} -> provider_unavailable(conn)
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

  defp complete_flow(conn, spec, code, state) do
    provider = to_string(spec.name)
    redirect_uri = oauth_callback_url(provider)

    is_popup =
      get_session(conn, :oauth_popup) == true ||
        conn.params["popup"] == "true" ||
        conn.query_params["popup"] == "true"

    result =
      with :ok <- Adapter.validate_state(spec, state) |> log_step("validate_state"),
           {:ok, token_data} <-
             Adapter.exchange_code(spec, code, state, redirect_uri) |> log_step("exchange_code"),
           {:ok, user_info} <-
             Adapter.get_user_info(spec, token_data["access_token"]) |> log_step("get_user_info"),
           :ok <- require_provider_id(user_info) do
        resolve(conn, spec, user_info, token_data)
      else
        :error ->
          Logger.error("OAuth callback failed: Invalid or expired OAuth state")
          {:error, "Invalid or expired OAuth state"}

        {:error, reason} ->
          Logger.error("OAuth callback failed: #{inspect(reason)}")
          {:error, reason}
      end

    case result do
      {:pending, pending, email} ->
        popup_message(conn, %{
          type: "oauth_signup",
          pending: pending,
          email: email,
          provider: spec.label,
          verify: OAuthAccounts.email_verification_required?()
        })

      {:linked, _user} ->
        popup_message(conn, %{type: "oauth_linked", provider: spec.label})

      {:error, :linked_to_another_user} ->
        popup_message(conn, %{
          type: "oauth_error",
          error: "That #{spec.label} account is already linked to another user."
        })

      {:ok, user} ->
        redirect_to = get_session(conn, :oauth_redirect_to)

        conn =
          conn
          |> put_flash(:info, "Successfully authenticated with #{spec.label}")
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
          ui_origin =
            if redirect_to do
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
          redirect_to =
            get_session(conn, :user_return_to) ||
              get_session(conn, :oauth_redirect_to) ||
              conn.params["redirect_to"] ||
              conn.query_params["redirect_to"]

          if redirect_to do
            if String.starts_with?(redirect_to, "http://") or
                 String.starts_with?(redirect_to, "https://") do
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

  defp maybe_put_session(conn, _key, nil), do: conn
  defp maybe_put_session(conn, _key, false), do: conn

  defp maybe_put_session(conn, key, value) when is_binary(value),
    do: put_session(conn, key, value)

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

  defp require_provider_id(user_info) do
    if OAuthAccounts.provider_user_id(user_info) == "",
      do: {:error, "Provider user ID not provided by OAuth provider"},
      else: :ok
  end

  # Linking from the account page, signing in to a linked account, or a new sign-up that
  # still needs the person to choose the account's email.
  defp resolve(conn, spec, user_info, token_data) do
    provider_user_id = OAuthAccounts.provider_user_id(user_info)

    case {OAuthAccounts.link_user(get_session(conn, :oauth_link)),
          OAuthAccounts.user_for(spec.name, provider_user_id)} do
      {{:ok, user}, _linked} ->
        with {:ok, _token} <- OAuthAccounts.link(user, spec.name, user_info, token_data),
             do: {:linked, user}

      {:error, nil} ->
        {:pending, OAuthAccounts.pending(spec.name, user_info, token_data),
         OAuthAccounts.provider_email(user_info)}

      {:error, user} ->
        with {:ok, _token} <- OAuthAccounts.link(user, spec.name, user_info, token_data),
             do: {:ok, user}
    end
  end

  # Hands a result to the window that opened the popup, then closes it
  defp popup_message(conn, payload) do
    origin = ui_origin(get_session(conn, :oauth_redirect_to), conn)

    conn
    |> delete_session(:oauth_link)
    |> put_resp_content_type("text/html")
    |> send_resp(200, """
    <!DOCTYPE html>
    <html>
    <head><title>Continue in the app</title></head>
    <body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0d1a;color:#e6fbff;font-family:sans-serif">
      <p>Continue in the app window...</p>
      <script>
        if (window.opener) window.opener.postMessage(#{Jason.encode!(payload, escape: :html_safe)}, #{Jason.encode!(origin, escape: :html_safe)});
        setTimeout(function () { window.close(); }, 300);
      </script>
    </body>
    </html>
    """)
  end

  defp ui_origin(nil, conn), do: ${ApiNameCamel}.UIUrl.origin(conn)

  defp ui_origin(redirect_to, _conn) do
    %URI{scheme: scheme, host: host, port: port} = URI.parse(redirect_to)
    "#{scheme}://#{host}:#{port}"
  end

  defp oauth_callback_url(provider, params \\\\ %{}) do
    base_url = "#{${ApiNameCamel}.Endpoint.url()}/oauth/#{provider}/callback"

    if map_size(params) > 0 do
      "#{base_url}?#{URI.encode_query(params)}"
    else
      base_url
    end
  end

end
`;

  return generateFile({ dir, filename, content }, "add_auth_oauth_controller");
};

export { add_auth_oauth_controller };


