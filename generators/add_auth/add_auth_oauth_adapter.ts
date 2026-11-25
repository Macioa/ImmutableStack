import { generateFile } from "..";
import { ApiAppData } from "../add_api";
import { OAUTH_PROVIDERS } from "./oauth_providers";
import { oauthDir } from "./add_auth_oauth_providers";

const providerList = () => OAUTH_PROVIDERS.map(({ module }) => `    Providers.${module}`).join(",\n");

// Runs the OAuth flow for every provider; providers themselves are data-only modules
const add_auth_oauth_adapter = async (apiAppData: ApiAppData) => {
  const { AppNameSnake, ApiNameSnake, ApiNameCamel } = apiAppData;
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const content = `defmodule ${ApiNameCamel}.OAuth.Adapter do
  @moduledoc """
  Runs the OAuth2 authorization code flow for any \`${ApiNameCamel}.OAuth.Provider\`.

  Credentials come from \`config :${apiAppName}, :oauth\` (see \`config/<env>/keys.exs\`).
  A provider without both a client ID and secret is treated as switched off:
  it is left out of \`enabled_providers/0\` and \`fetch_provider/1\` refuses it.
  """

  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.OAuth.Providers

  @providers [
${providerList()}
  ]

  @user_agent "${apiAppName}-oauth/1.0"

  ## Providers

  @doc "Providers whose keys are configured, with their credentials attached."
  def enabled_providers, do: @providers |> Enum.map(&with_credentials/1) |> Enum.filter(&enabled?/1)

  @doc "Name and label of each enabled provider, for the UI to render buttons."
  def public_providers, do: Enum.map(enabled_providers(), &Map.take(&1, [:name, :label]))

  @doc "Finds an enabled provider by its name, e.g. \\"google\\"."
  def fetch_provider(name),
    do: enabled_providers() |> Enum.find(&(to_string(&1.name) == name)) |> found()

  defp found(nil), do: {:error, :provider_not_configured}
  defp found(spec), do: {:ok, spec}

  defp with_credentials(module) do
    spec = module.spec()
    keys = :${apiAppName} |> Application.get_env(:oauth, []) |> Keyword.get(spec.name, [])

    Map.merge(spec, %{
      client_id: resolve(keys[:client_id]),
      client_secret: resolve(keys[:client_secret])
    })
  end

  defp resolve({:system, var}), do: System.get_env(var, "")
  defp resolve(value) when is_binary(value), do: value
  defp resolve(_value), do: ""

  defp enabled?(%{client_id: id, client_secret: secret}), do: id != "" and secret != ""

  ## Flow

  @doc "Stores a CSRF state and returns the provider's authorization URL."
  def authorization_url(spec, redirect_uri) do
    state = random_token()

    with {:ok, _oauth_state} <- Accounts.create_oauth_state(spec.name, state) do
      query =
        %{
          client_id: spec.client_id,
          redirect_uri: redirect_uri,
          response_type: "code",
          scope: spec.scope,
          state: state
        }
        |> Map.merge(pkce_challenge(spec, state))
        |> Map.merge(spec.authorize_params)

      {:ok, spec.authorize_url <> "?" <> URI.encode_query(query, :rfc3986)}
    end
  end

  @doc "Validates and consumes a CSRF state."
  def validate_state(spec, state), do: Accounts.validate_oauth_state(state, spec.name)

  @doc "Exchanges an authorization code for the provider's token response."
  def exchange_code(spec, code, state, redirect_uri) do
    form =
      %{code: code, redirect_uri: redirect_uri, grant_type: "authorization_code"}
      |> Map.merge(client_credentials(spec))
      |> Map.merge(pkce_verifier(spec, state))

    [url: spec.token_url, method: :post, form: form, headers: headers()]
    |> Keyword.merge(basic_auth(spec))
    |> request()
  end

  @doc "Fetches the user's profile and normalizes it to id, email, name and picture."
  def get_user_info(spec, access_token) do
    with {:ok, profile} <- get(spec.user_url, access_token) do
      {:ok, normalize(spec, profile, access_token)}
    end
  end

  ## Client authentication and PKCE

  defp client_credentials(%{token_auth: :basic, client_id: id}), do: %{client_id: id}
  defp client_credentials(%{client_id: id, client_secret: secret}), do: %{client_id: id, client_secret: secret}

  defp basic_auth(%{token_auth: :basic, client_id: id, client_secret: secret}), do: [auth: {:basic, "#{id}:#{secret}"}]
  defp basic_auth(_spec), do: []

  # The verifier is derived from the single-use state, so nothing extra is stored
  defp pkce_challenge(%{pkce: true} = spec, state),
    do: %{code_challenge: spec |> verifier(state) |> sha256(), code_challenge_method: "S256"}

  defp pkce_challenge(_spec, _state), do: %{}

  defp pkce_verifier(%{pkce: true} = spec, state), do: %{code_verifier: verifier(spec, state)}
  defp pkce_verifier(_spec, _state), do: %{}

  defp verifier(spec, state), do: :hmac |> :crypto.mac(:sha256, spec.client_secret, state) |> encode()

  defp sha256(value), do: :sha256 |> :crypto.hash(value) |> encode()

  ## Profile normalization

  defp normalize(spec, profile, access_token) do
    id = profile |> field(spec.fields[:id]) |> stringify()

    %{
      "id" => id,
      "email" => field(profile, spec.fields[:email]) || primary_email(spec, access_token) || placeholder_email(spec, id),
      "name" => field(profile, spec.fields[:name]),
      "picture" => field(profile, spec.fields[:picture])
    }
  end

  defp field(profile, paths), do: Enum.find_value(paths, &dig(profile, String.split(&1, ".")))

  defp dig(value, []), do: value
  defp dig(%{} = map, [key | rest]), do: dig(Map.get(map, key), rest)
  defp dig(_value, _path), do: nil

  defp primary_email(%{emails_url: nil}, _access_token), do: nil

  defp primary_email(%{emails_url: url}, access_token) do
    case get(url, access_token) do
      {:ok, emails} when is_list(emails) -> Enum.find_value(emails, &(&1["primary"] && &1["verified"] && &1["email"]))
      _ -> nil
    end
  end

  # Providers that never share an email still need a unique, undeliverable address
  defp placeholder_email(_spec, nil), do: nil
  defp placeholder_email(spec, id), do: "#{id}@#{spec.name}.oauth.invalid"

  ## HTTP

  defp get(url, access_token),
    do: request(url: url, method: :get, headers: [{"authorization", "Bearer #{access_token}"} | headers()])

  defp headers, do: [{"accept", "application/json"}, {"user-agent", @user_agent}]

  defp request(opts), do: opts |> Req.request() |> response()

  defp response({:ok, %Req.Response{status: 200, body: body}}), do: {:ok, decode(body)}
  defp response({:ok, %Req.Response{status: status, body: body}}), do: {:error, {:http_error, status, body}}
  defp response({:error, reason}), do: {:error, reason}

  # Req decodes JSON bodies; some token endpoints still answer form-encoded
  defp decode(body) when is_binary(body) do
    case Jason.decode(body) do
      {:ok, decoded} -> decoded
      {:error, _} -> URI.decode_query(body)
    end
  end

  defp decode(body), do: body

  defp stringify(nil), do: nil
  defp stringify(value), do: to_string(value)

  defp random_token, do: 32 |> :crypto.strong_rand_bytes() |> encode()

  defp encode(bytes), do: Base.url_encode64(bytes, padding: false)
end
`;

  return generateFile({ dir: oauthDir(apiAppData), filename: "adapter.ex", content }, "add_auth_oauth_adapter");
};

// Behaviour each provider module implements through `use ...OAuth.Provider`
const add_auth_oauth_provider_behaviour = async (apiAppData: ApiAppData) => {
  const { ApiNameCamel } = apiAppData;
  const content = `defmodule ${ApiNameCamel}.OAuth.Provider do
  @moduledoc """
  Behaviour for OAuth providers.

  A provider only describes itself (endpoints, scope, quirks and where the user
  fields live in its profile response). \`${ApiNameCamel}.OAuth.Adapter\` does all of the
  work, so adding a provider means adding one small module:

      defmodule ${ApiNameCamel}.OAuth.Providers.Example do
        use ${ApiNameCamel}.OAuth.Provider,
          name: :example,
          label: "Example",
          authorize_url: "https://example.com/oauth/authorize",
          token_url: "https://example.com/oauth/token",
          user_url: "https://example.com/api/me",
          scope: "email profile"
      end

  Options:
    * \`:token_auth\` - \`:body\` (default) sends the client credentials in the form,
      \`:basic\` sends them as HTTP basic auth
    * \`:pkce\` - \`true\` adds a PKCE challenge (required by some providers)
    * \`:authorize_params\` - extra query params for the authorize URL
    * \`:emails_url\` - endpoint listing the user's emails, used when the profile has none
    * \`:fields\` - where \`id\`, \`email\`, \`name\` and \`picture\` live in the profile.
      Each is a list of dotted paths tried in order, e.g. \`email: ["mail", "upn"]\`
  """

  @callback spec() :: map()

  @default_fields [id: ["id", "sub"], email: ["email"], name: ["name"], picture: ["picture"]]
  @defaults [token_auth: :body, pkce: false, authorize_params: %{}, emails_url: nil]

  def build(opts) do
    @defaults
    |> Keyword.merge(opts)
    |> Keyword.put(:fields, Keyword.merge(@default_fields, Keyword.get(opts, :fields, [])))
    |> Map.new()
  end

  defmacro __using__(opts) do
    quote do
      @behaviour ${ApiNameCamel}.OAuth.Provider

      @impl true
      def spec, do: ${ApiNameCamel}.OAuth.Provider.build(unquote(opts))
    end
  end
end
`;

  return generateFile({ dir: oauthDir(apiAppData), filename: "provider.ex", content }, "add_auth_oauth_provider_behaviour");
};

export { add_auth_oauth_adapter, add_auth_oauth_provider_behaviour };
