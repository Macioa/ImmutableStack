import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

// Passkeys, recovery codes, invitations and the first-account claim (ithibati).
// Templates mirror a verified sample app; app names are interpolated.

const add_auth_passkey_handler = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}`),
      filename: "passkeys.ex",
      content: `defmodule ${ApiNameCamel}.Passkeys do
  @moduledoc """
  Ithibati handler: passkey ceremonies answer with the same JSON and bearer
  token as password login, so the UI treats every sign-in alike.
  """
  @behaviour Ithibati.Web.Handler

  import Phoenix.Controller, only: [json: 2]
  import Plug.Conn, only: [get_session: 2]

  alias Ecto.Multi
  alias Ithibati.Identity.{Grant, Instance, Invitations, Passkeys}
  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.Accounts.User
  alias ${ApiNameCamel}.UserAuth
  alias ${AppNameCamel}.AuthRepo, as: Repo

  # A signed-in user enrolls another passkey on their own account.
  @impl true
  def registration_subject(%{assigns: %{current_user: %User{} = user}}, _params), do: {:ok, user}

  def registration_subject(_conn, %{"token" => token} = params) do
    case Invitations.fetch(token) do
      nil ->
        {:error, :invitation_unknown}

      invitation ->
        if Invitations.open?(invitation), do: new_email(params), else: {:ok, invitation.email}
    end
  end

  def registration_subject(conn, params) do
    if Accounts.operator_claim?() and Instance.needs_setup?() and
         not Instance.authorized?(get_session(conn, :initial_claim_authorization)),
       do: {:error, :setup_authorization_required},
       else: new_email(params)
  end

  defp new_email(%{"email" => email}) do
    %User{}
    |> User.identifier_changeset(%{"email" => email})
    |> Ecto.Changeset.apply_action(:insert)
    |> case do
      {:ok, user} -> {:ok, user.email}
      {:error, _changeset} -> {:error, :invalid_email}
    end
  end

  defp new_email(_params), do: {:error, :email_required}

  @impl true
  def register(conn, key_attrs, %User{} = user, params) do
    case Passkeys.add_key(user, Passkeys.key_attrs(key_attrs, params["label"])) do
      {:ok, key} -> {:ok, json(conn, %{data: Map.take(key, [:id, :label, :inserted_at])})}
      error -> error
    end
  end

  def register(conn, key_attrs, email, params) do
    Multi.new()
    |> Multi.insert(:account, User.identifier_changeset(%User{}, %{"email" => email}))
    |> accept_invitation(params)
    |> Accounts.claim_first_account(get_session(conn, :initial_claim_authorization))
    |> Grant.with_key_and_codes(key_attrs, count: ${ApiNameCamel}.Accounts.Recovery.count())
    |> Repo.transaction()
    |> case do
      {:ok, %{account: user, recovery_codes: codes}} ->
        {:ok, verify_email_or(conn, user, &signed_in(&1, user, %{recovery_codes: codes}))}

      {:error, :account, changeset, _} ->
        {:error, taken_or_invalid(changeset)}

      {:error, _step, reason, _changes} ->
        {:error, reason}
    end
  end

  @impl true
  def authenticate(conn, user), do: {:ok, verify_email_or(conn, user, &signed_in(&1, user))}

  # Under require_2fa an unverified email is verified with an emailed code before any session
  defp verify_email_or(conn, user, sign_in) do
    if ${ApiNameCamel}.Accounts.TwoFactor.email_unverified?(user) do
      ${ApiNameCamel}.Accounts.TwoFactor.deliver_email_code(user)
      json(conn, %{two_factor: ${ApiNameCamel}.Accounts.TwoFactor.challenge_payload(user)})
    else
      sign_in.(conn)
    end
  end

  @impl true
  def recovered(conn, user, nil), do: authenticate(conn, user)
  def recovered(conn, user, fresh), do: {:ok, signed_in(conn, user, %{recovery_codes: fresh})}

  # Passkeys are bound to the RP ID (the host); the UI runs on its own port, so
  # trust the same fixed origin list the CORS plug already allows.
  @impl true
  def relying_party(_conn, {rp_id, origin}),
    do: {rp_id, Enum.uniq([origin | Application.get_env(:${AppNameSnake}, CORSPlug)[:origin] || []])}

  # Without a token registration stays open; with one the invitation must still be pending.
  defp accept_invitation(multi, %{"token" => token}) do
    case Invitations.fetch(token) do
      nil -> Multi.error(multi, :invitation, :invalid_invitation)
      invitation -> Invitations.accept(multi, invitation)
    end
  end

  defp accept_invitation(multi, _params), do: multi

  defp signed_in(conn, user, extra \\\\ %{}) do
    conn = UserAuth.log_in_user_json(conn, user)
    token = conn |> get_session(:user_token) |> Base.url_encode64()
    json(conn, Map.merge(${ApiNameCamel}.UserJSON.show(%{user: user, token: token}), extra))
  end

  defp taken_or_invalid(changeset),
    do:
      if(Ithibati.Schema.User.identifier_taken?(changeset),
        do: :email_taken,
        else: :invalid_email
      )
end
`,
    },
    "add_auth_passkey_handler"
  );

const add_auth_invitation_schema = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/accounts`),
      filename: "invitation.ex",
      content: `defmodule ${ApiNameCamel}.Accounts.Invitation do
  use Ecto.Schema

  use Ithibati.Schema.Invitation,
    identifier: :email,
    format: Ithibati.Schema.Identifier.email_format()

  @primary_key {:id, :binary_id, autogenerate: true}

  schema "invitations" do
    ithibati_invitation()
    timestamps(type: :utc_datetime_usec)
  end

  def changeset(invitation, attrs, opts \\\\ []), do: invitation_changeset(invitation, attrs, opts)
end
`,
    },
    "add_auth_invitation_schema"
  );

const add_auth_passkey_json_controller = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`),
      filename: "passkey_json_controller.ex",
      content: `defmodule ${ApiNameCamel}.PasskeyJSONController do
  use ${ApiNameCamel}, :controller

  alias Ithibati.Identity.Passkeys

  def index(conn, _params),
    do: json(conn, %{data: conn.assigns.current_user |> Passkeys.list_keys() |> Enum.map(&show/1)})

  def update(conn, %{"id" => id, "label" => label}),
    do: conn.assigns.current_user |> Passkeys.rename_key(id, label) |> reply(conn)

  # Password accounts may drop their last passkey; passkey-only accounts may not.
  def delete(%{assigns: %{current_user: user}} = conn, %{"id" => id}),
    do: user |> Passkeys.delete_key(id, last: if(user.hashed_password, do: :allow, else: :refuse)) |> reply(conn)

  defp reply({:ok, key}, conn), do: json(conn, %{data: show(key)})
  defp reply({:error, reason}, conn), do: conn |> put_status(:unprocessable_entity) |> json(%{error: reason})

  defp show(key), do: Map.take(key, [:id, :label, :last_used_at, :inserted_at])
end
`,
    },
    "add_auth_passkey_json_controller"
  );

const add_auth_recovery_code_json_controller = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`),
      filename: "recovery_code_json_controller.ex",
      content: `defmodule ${ApiNameCamel}.RecoveryCodeJSONController do
  use ${ApiNameCamel}, :controller

  alias Ithibati.Identity.RecoveryCodes
  alias ${ApiNameCamel}.Accounts.Recovery

  def show(conn, _params),
    do: json(conn, %{remaining: RecoveryCodes.remaining(conn.assigns.current_user)})

  # Invalidates the old batch; the new codes are shown once and never again.
  def create(conn, _params),
    do: json(conn, %{recovery_codes: Recovery.issue(conn.assigns.current_user)})
end
`,
    },
    "add_auth_recovery_code_json_controller"
  );

const add_auth_invitation_json_controller = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`),
      filename: "invitation_json_controller.ex",
      content: `defmodule ${ApiNameCamel}.InvitationJSONController do
  use ${ApiNameCamel}, :controller

  alias Ithibati.Identity.Invitations
  alias ${ApiNameCamel}.Accounts.{Invitation, UserNotifier}
  alias ${AppNameCamel}.AuthRepo, as: Repo

  def index(conn, _params), do: json(conn, %{data: Enum.map(Invitations.pending(), &show/1)})

  # With an email the invitation is locked to it; without one the invitee picks their own.
  def create(conn, params) do
    %Invitation{invited_by_id: conn.assigns.current_user.id}
    |> Invitation.changeset(params, addressed: Map.has_key?(params, "email"))
    |> Repo.insert()
    |> case do
      {:ok, invitation} ->
        email_invitation(conn, invitation)
        json(conn, %{data: Map.put(show(invitation), :token, invitation.token)})

      {:error, changeset} -> conn |> put_status(:unprocessable_entity) |> json(%{errors: errors(changeset)})
    end
  end

  def delete(conn, %{"id" => id}) do
    Invitation |> Repo.get!(id) |> Invitations.withdraw()
    json(conn, %{status: "withdrawn"})
  end

  # An invitation addressed to someone is also emailed to them
  defp email_invitation(_conn, %Invitation{email: nil}), do: :ok

  defp email_invitation(conn, %Invitation{email: email, note: note, token: token}),
    do:
      UserNotifier.deliver_invitation(
        email,
        ${ApiNameCamel}.UIUrl.link(conn, "invite", token),
        conn.assigns.current_user.email,
        note
      )

  defp show(invitation), do: Map.take(invitation, [:id, :email, :note, :expires_at])

  defp errors(changeset),
    do: Ecto.Changeset.traverse_errors(changeset, fn {message, _opts} -> message end)
end
`,
    },
    "add_auth_invitation_json_controller"
  );

const add_auth_setup_json_controller = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/${AppNameSnake}_${ApiNameSnake}/controllers`),
      filename: "setup_json_controller.ex",
      content: `defmodule ${ApiNameCamel}.SetupJSONController do
  use ${ApiNameCamel}, :controller

  alias Ithibati.Identity.Instance

  @doc "Exchanges the operator code for a short-lived proof kept in the session."
  def create(conn, %{"code" => code}) do
    case Instance.authorize_code(code) do
      {:ok, proof} -> conn |> put_session(:initial_claim_authorization, proof) |> json(%{status: "authorized"})
      {:error, reason} -> conn |> put_status(:unprocessable_entity) |> json(%{error: reason})
    end
  end

  def show(conn, _params), do: json(conn, %{needs_setup: Instance.needs_setup?()})
end
`,
    },
    "add_auth_setup_json_controller"
  );

const add_auth_setup_code_task = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/lib/mix/tasks`),
      filename: "setup_code.ex",
      content: `defmodule Mix.Tasks.${AppNameCamel}Auth.SetupCode do
  @shortdoc "Prints a one-time operator code for claiming the first account"
  @moduledoc "Run again to rotate the code. Print it only to the operator's terminal."
  use Mix.Task

  @requirements ["app.start"]

  @impl true
  def run(_args) do
    case Ithibati.Identity.Instance.issue_code() do
      {:ok, code} -> Mix.shell().info(code)
      {:error, reason} -> Mix.raise("No code issued: #{reason}")
    end
  end
end
`,
    },
    "add_auth_setup_code_task"
  );

const add_auth_credo = async ({ AppDir, AppNameSnake, ApiNameSnake }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}`),
      filename: ".credo.exs",
      content: `%{
  configs: [
    %{
      name: "default",
      # config/ lets NoWaxConfiguration read wax_ settings.
      files: %{included: ["lib/", "test/", "../../config/"]},
      checks: %{
        extra: [
          {Ithibati.Credo.NoDirectTableAccess, []},
          {Ithibati.Credo.NoWaxConfiguration, []},
          {Ithibati.Credo.NoInternalCalls, []}
        ]
      }
    }
  ]
}
`,
    },
    "add_auth_credo"
  );

const add_auth_ithibati_helpers = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/support`),
      filename: "ithibati_helpers.ex",
      content: `defmodule ${ApiNameCamel}.IthibatiHelpers do
  @moduledoc "Claims the instance the way the current initial_claim mode requires."
  alias Ecto.Multi
  alias Ithibati.Identity.Instance
  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.Accounts.User

  def claim_instance! do
    {:ok, %{account: owner}} =
      Multi.new()
      |> Multi.insert(:account, User.identifier_changeset(%User{}, %{"email" => "owner@example.com"}))
      |> Accounts.claim_first_account(operator_proof())
      |> ${AppNameCamel}.AuthRepo.transaction()

    owner
  end

  defp operator_proof do
    with true <- Accounts.operator_claim?(),
         {:ok, code} <- Instance.issue_code(),
         {:ok, proof} <- Instance.authorize_code(code),
         do: proof,
         else: (_ -> nil)
  end
end
`,
    },
    "add_auth_ithibati_helpers"
  );

const add_auth_sessions_test = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}/ithibati`),
      filename: "sessions_test.exs",
      content: `defmodule ${ApiNameCamel}.Ithibati.SessionsTest do
  use ${ApiNameCamel}.ConnCase, async: false

  alias ${AppNameCamel}.AuthRepo, as: Repo
  alias ${ApiNameCamel}.Accounts

  @password "a valid long password"

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    email = "user#{System.unique_integer([:positive])}@example.com"
    {:ok, user} = Accounts.register_user(%{email: email, password: @password})
    {:ok, user: user}
  end

  defp log_in(user) do
    build_conn()
    |> post("/api/users/log_in", %{email: user.email, password: @password})
    |> json_response(200)
    |> Map.fetch!("token")
  end

  defp settings(token),
    do: build_conn() |> put_req_header("authorization", "Bearer " <> token) |> get("/api/users/settings")

  test "stores only a digest of the session token", %{user: user} do
    raw = user |> log_in() |> Base.url_decode64!()
    # Proving only a digest is stored needs the raw row.
    # credo:disable-for-next-line Ithibati.Credo.NoDirectTableAccess
    [stored] = Repo.all(Ithibati.Session)

    refute stored.token_hash == raw
    assert Accounts.get_user_by_session_token(raw).id == user.id
  end

  test "sign-out deletes the session row immediately", %{user: user} do
    token = log_in(user)
    assert settings(token).status == 200

    build_conn() |> put_req_header("authorization", "Bearer " <> token) |> delete("/api/users/log_out")

    # credo:disable-for-next-line Ithibati.Credo.NoDirectTableAccess
    assert Repo.all(Ithibati.Session) == []
    assert settings(token).status == 401
  end

  test "sign out everywhere revokes every session and disconnects sockets", %{user: user} do
    [first, second] = [log_in(user), log_in(user)]
    topic = second |> Base.url_decode64!() |> Ithibati.Web.Gate.live_socket_id()
    ${ApiNameCamel}.Endpoint.subscribe(topic)

    build_conn() |> put_req_header("authorization", "Bearer " <> first) |> delete("/api/users/sessions")

    assert settings(first).status == 401
    assert settings(second).status == 401
    assert_receive %Phoenix.Socket.Broadcast{topic: ^topic, event: "disconnect"}
  end
end
`,
    },
    "add_auth_sessions_test"
  );

const add_auth_ceremony_test = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}/ithibati`),
      filename: "ceremony_test.exs",
      content: `defmodule ${ApiNameCamel}.Ithibati.CeremonyTest do
  use ${ApiNameCamel}.ConnCase, async: false

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(${AppNameCamel}.AuthRepo)
    ${ApiNameCamel}.IthibatiHelpers.claim_instance!()
    :ok
  end

  test "registration challenge returns creation options for a valid email" do
    body =
      build_conn()
      |> post("/auth/registration/challenge", %{email: "New@Example.com"})
      |> json_response(200)

    assert body["rp"]["id"] == "localhost"
    assert body["user"]["name"] == "new@example.com"
    assert body["authenticatorSelection"]["residentKey"] == "required"
  end

  test "registration challenge refuses an invalid email" do
    assert %{"error" => "invalid_email"} =
             build_conn() |> post("/auth/registration/challenge", %{email: "nope"}) |> json_response(422)
  end

  test "registration without a challenge is refused" do
    assert %{"error" => "no_challenge"} =
             build_conn() |> post("/auth/registration", %{email: "a@b.co", credential: %{}}) |> json_response(422)
  end
end
`,
    },
    "add_auth_ceremony_test"
  );

const add_auth_passkey_management_test = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}/ithibati`),
      filename: "passkey_management_test.exs",
      content: `defmodule ${ApiNameCamel}.Ithibati.PasskeyManagementTest do
  use ${ApiNameCamel}.ConnCase, async: false

  alias Ithibati.Identity.{Passkeys, Sessions}
  alias ${ApiNameCamel}.Accounts.User
  alias ${AppNameCamel}.AuthRepo, as: Repo

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
  end

  defp user(attrs) do
    email = "user#{System.unique_integer([:positive])}@example.com"
    Repo.insert!(struct(User, Map.put(attrs, :email, email)))
  end

  defp key(user, label) do
    {:ok, key} = Passkeys.add_key(user, %{key_id: :crypto.strong_rand_bytes(16), public_key: "pk", label: label})
    key
  end

  defp api(user) do
    token = user |> Sessions.generate_session_token() |> Base.url_encode64()
    put_req_header(build_conn(), "authorization", "Bearer " <> token)
  end

  test "lists, renames and revokes passkeys" do
    user = user(%{})
    [laptop, _phone] = [key(user, "Laptop"), key(user, "Phone")]

    %{"data" => listed} = user |> api() |> get("/api/users/passkeys") |> json_response(200)
    assert listed |> Enum.map(& &1["label"]) |> Enum.sort() == ["Laptop", "Phone"]

    assert %{"data" => %{"label" => "Work laptop"}} =
             user |> api() |> put("/api/users/passkeys/#{laptop.id}", %{label: "Work laptop"}) |> json_response(200)

    user |> api() |> delete("/api/users/passkeys/#{laptop.id}") |> json_response(200)
    assert [%{label: "Phone"}] = Passkeys.list_keys(user)
  end

  test "a passkey-only account keeps its last passkey" do
    user = user(%{})
    only = key(user, "Only")

    assert %{"error" => "last_key"} =
             user |> api() |> delete("/api/users/passkeys/#{only.id}") |> json_response(422)
  end

  test "a password account may remove its last passkey" do
    user = user(%{hashed_password: "x"})
    only = key(user, "Only")

    user |> api() |> delete("/api/users/passkeys/#{only.id}") |> json_response(200)
  end

  test "another user's passkey is not found" do
    theirs = key(user(%{}), "Theirs")

    assert %{"error" => "not_found"} =
             user(%{}) |> api() |> delete("/api/users/passkeys/#{theirs.id}") |> json_response(422)
  end

  test "a signed-in user's registration challenge targets their account" do
    user = user(%{})
    body = user |> api() |> post("/auth/registration/challenge", %{}) |> json_response(200)
    assert body["user"]["name"] == user.email
  end
end
`,
    },
    "add_auth_passkey_management_test"
  );

const add_auth_recovery_codes_test = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}/ithibati`),
      filename: "recovery_codes_test.exs",
      content: `defmodule ${ApiNameCamel}.Ithibati.RecoveryCodesTest do
  use ${ApiNameCamel}.ConnCase, async: false

  alias Ithibati.Identity.{RecoveryCodes, Sessions}
  alias ${ApiNameCamel}.Accounts.User
  alias ${AppNameCamel}.AuthRepo, as: Repo

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    {:ok, user: Repo.insert!(%User{email: "user#{System.unique_integer([:positive])}@example.com"})}
  end

  defp api(user) do
    token = user |> Sessions.generate_session_token() |> Base.url_encode64()
    put_req_header(build_conn(), "authorization", "Bearer " <> token)
  end

  defp recover(code), do: build_conn() |> post("/auth/recovery", %{code: code})

  test "regenerating returns a new batch and invalidates the old one", %{user: user} do
    [old | _] = RecoveryCodes.regenerate(user)
    %{"recovery_codes" => codes} = user |> api() |> post("/api/users/recovery_codes") |> json_response(200)

    assert length(codes) == 12
    assert %{"remaining" => 12} = user |> api() |> get("/api/users/recovery_codes") |> json_response(200)
    assert %{"error" => "invalid_code"} = old |> recover() |> json_response(422)
  end

  test "a recovery code signs in once and returns a bearer token", %{user: user} do
    [code | _] = RecoveryCodes.regenerate(user)

    %{"token" => token, "data" => %{"email" => email}} = code |> recover() |> json_response(200)
    assert email == user.email
    assert Sessions.get_user_by_session_token(Base.url_decode64!(token)).id == user.id
    assert %{"error" => "invalid_code"} = code |> recover() |> json_response(422)
  end

  test "spending the last code refills the batch", %{user: user} do
    codes = RecoveryCodes.regenerate(user)
    codes |> Enum.drop(-1) |> Enum.each(&(&1 |> recover() |> json_response(200)))

    %{"recovery_codes" => fresh} = codes |> List.last() |> recover() |> json_response(200)
    assert length(fresh) == 12
    assert RecoveryCodes.remaining(user) == 12
  end
end
`,
    },
    "add_auth_recovery_codes_test"
  );

const add_auth_invitations_test = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}/ithibati`),
      filename: "invitations_test.exs",
      content: `defmodule ${ApiNameCamel}.Ithibati.InvitationsTest do
  use ${ApiNameCamel}.ConnCase, async: false

  alias Ecto.Multi
  alias Ithibati.Identity.{Invitations, Sessions}
  alias ${ApiNameCamel}.Accounts.{AccessTag, Invitation, User, UserAccess}
  alias ${AppNameCamel}.AuthRepo, as: Repo

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    Repo.insert!(%AccessTag{name: "invitations"}, on_conflict: :nothing)
    inviter = Repo.insert!(%User{email: "inviter#{System.unique_integer([:positive])}@example.com"})
    {:ok, inviter: inviter}
  end


  defp api(user) do
    token = user |> Sessions.generate_session_token() |> Base.url_encode64()
    put_req_header(build_conn(), "authorization", "Bearer " <> token)
  end

  defp grant(user), do: Repo.insert!(%UserAccess{user_id: user.id, tag_id: "invitations"})

  defp challenge(params), do: build_conn() |> post("/auth/registration/challenge", params)

  test "inviting requires the invitations access tag", %{inviter: inviter} do
    assert inviter |> api() |> post("/api/invitations", %{email: "x@example.com"}) |> response(403)
  end

  test "an addressed invitation locks registration to its email", %{inviter: inviter} do
    grant(inviter)

    %{"data" => %{"token" => token, "email" => "bob@example.com"}} =
      inviter |> api() |> post("/api/invitations", %{email: "Bob@Example.com"}) |> json_response(200)

    body = %{token: token, email: "someone-else@example.com"} |> challenge() |> json_response(200)
    assert body["user"]["name"] == "bob@example.com"
  end

  test "an open invitation lets the invitee pick an email", %{inviter: inviter} do
    grant(inviter)

    %{"data" => %{"token" => token, "email" => nil}} =
      inviter |> api() |> post("/api/invitations", %{note: "Grace"}) |> json_response(200)

    body = %{token: token, email: "grace@example.com"} |> challenge() |> json_response(200)
    assert body["user"]["name"] == "grace@example.com"
  end

  test "unknown and expired tokens are refused", %{inviter: inviter} do
    assert %{"error" => "invitation_unknown"} = %{token: "nope"} |> challenge() |> json_response(422)

    {:ok, invitation} =
      %Invitation{invited_by_id: inviter.id}
      |> Invitation.changeset(%{"email" => "late@example.com"})
      |> Repo.insert()

    invitation |> Ecto.Changeset.change(expires_at: DateTime.add(DateTime.utc_now(), -1, :day)) |> Repo.update!()
    assert %{"error" => "invitation_unknown"} = %{token: invitation.token} |> challenge() |> json_response(422)
  end

  test "an invitation is single-use", %{inviter: inviter} do
    {:ok, invitation} =
      %Invitation{invited_by_id: inviter.id}
      |> Invitation.changeset(%{"email" => "once@example.com"})
      |> Repo.insert()

    {:ok, _} =
      Multi.new()
      |> Multi.insert(:account, User.identifier_changeset(%User{}, %{"email" => "once@example.com"}))
      |> Invitations.accept(invitation)
      |> Repo.transaction()

    assert Invitations.fetch(invitation.token) == nil
    assert %{"error" => "invitation_unknown"} = %{token: invitation.token} |> challenge() |> json_response(422)
  end

  test "listing and withdrawing pending invitations", %{inviter: inviter} do
    grant(inviter)
    %{"data" => %{"id" => id}} = inviter |> api() |> post("/api/invitations", %{note: "x"}) |> json_response(200)

    assert %{"data" => [%{"id" => ^id}]} = inviter |> api() |> get("/api/invitations") |> json_response(200)
    inviter |> api() |> delete("/api/invitations/#{id}") |> json_response(200)
    assert %{"data" => []} = inviter |> api() |> get("/api/invitations") |> json_response(200)
  end
end
`,
    },
    "add_auth_invitations_test"
  );

const add_auth_operator_guard_test = async ({ AppDir, AppNameSnake, AppNameCamel, ApiNameSnake, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(AppDir || "", `${AppNameSnake}_${ApiNameSnake}/test/${AppNameSnake}_${ApiNameSnake}/ithibati`),
      filename: "operator_guard_test.exs",
      content: `defmodule ${ApiNameCamel}.Ithibati.OperatorGuardTest do
  use ${ApiNameCamel}.ConnCase, async: false

  alias Ithibati.Identity.Instance

  # Prod's setting; dev, docker and test leave the first claim open.
  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(${AppNameCamel}.AuthRepo)
    Application.put_env(:ithibati, :initial_claim, :operator_code)
    on_exit(fn -> Application.delete_env(:ithibati, :initial_claim) end)
  end

  defp challenge(conn), do: post(conn, "/auth/registration/challenge", %{email: "admin@example.com"})

  test "an unclaimed instance refuses passkey sign-up without the operator code" do
    assert %{"needs_setup" => true} = build_conn() |> get("/auth/setup") |> json_response(200)
    assert %{"error" => "setup_authorization_required"} = build_conn() |> challenge() |> json_response(422)
  end

  test "a wrong operator code is refused" do
    {:ok, _code} = Instance.issue_code()

    assert %{"error" => "invalid_setup_code"} =
             build_conn() |> post("/auth/setup", %{code: "wrong"}) |> json_response(422)
  end

  test "the operator code authorizes the first passkey sign-up" do
    {:ok, code} = Instance.issue_code()
    conn = build_conn() |> post("/auth/setup", %{code: code})
    assert %{"status" => "authorized"} = json_response(conn, 200)

    body = conn |> recycle() |> challenge() |> json_response(200)
    assert body["user"]["name"] == "admin@example.com"
  end

  test "in open mode the first sign-up of any kind claims the instance as admin" do
    Application.delete_env(:ithibati, :initial_claim)
    assert build_conn() |> challenge() |> json_response(200)

    {:ok, first} = ${ApiNameCamel}.Accounts.register_user(%{email: "first@example.com", password: "a valid long password"})
    {:ok, second} = ${ApiNameCamel}.Accounts.register_user(%{email: "second@example.com", password: "a valid long password"})

    refute Instance.needs_setup?()
    assert ${AppNameCamel}.AuthRepo.get_by(${ApiNameCamel}.Accounts.UserAccess, user_id: first.id, tag_id: "invitations")
    refute ${AppNameCamel}.AuthRepo.get_by(${ApiNameCamel}.Accounts.UserAccess, user_id: second.id, tag_id: "invitations")
  end

  test "once claimed, no code can be issued and registration is open" do
    ${ApiNameCamel}.IthibatiHelpers.claim_instance!()

    assert {:error, :already_claimed} = Instance.issue_code()
    assert %{"needs_setup" => false} = build_conn() |> get("/auth/setup") |> json_response(200)
    assert build_conn() |> challenge() |> json_response(200)
  end
end
`,
    },
    "add_auth_operator_guard_test"
  );

const add_auth_browser_test = async ({ WebDir, AppNameCamel, ApiNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(WebDir || "", `test/browser`),
      filename: "passkeys_test.exs",
      content: `defmodule ${AppNameCamel}Web.Browser.PasskeysTest do
  # Run with: BROWSER_TESTS=1 mix test --only e2e
  use PhoenixTest.Playwright.Case, async: false

  import Ithibati.Testing.Passkeys

  alias Ithibati.Identity.Passkeys
  alias ${ApiNameCamel}.Accounts.{User, UserAccess}
  alias ${AppNameCamel}.AuthRepo

  @moduletag :e2e

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(AuthRepo)
    Ecto.Adapters.SQL.Sandbox.mode(AuthRepo, {:shared, self()})
  end

  defp menu(conn, item),
    do: conn |> click(".ant-avatar") |> click(".ant-dropdown-menu-item", item)

  # Account sections live in the account modal's left navigation; groups expand first.
  defp account(conn, section, group \\\\ nil) do
    conn = menu(conn, "Account")
    conn = if group, do: click(conn, ".account-nav .ant-menu-submenu-title", group), else: conn
    click(conn, ".account-nav .ant-menu-item", section)
  end

  defp register(conn, email) do
    conn
    |> menu("Register")
    |> type("#register_email", email)
    |> click_button("Register with a passkey")
    |> assert_has("[data-testid=recovery-codes]")
  end

  defp close_codes(conn),
    do: conn |> click_button("OK") |> refute_has("[data-testid=recovery-codes]")

  # evaluate/3 hands the page's value to a callback in this process.
  defp value(conn, js) do
    evaluate(conn, js, &send(self(), {:value, &1}))
    assert_receive {:value, value}
    value
  end

  defp codes(conn),
    do:
      conn
      |> value("document.querySelector('[data-testid=recovery-codes]').innerText")
      |> String.split()

  defp signed_in_as(conn, email),
    do: conn |> click(".ant-avatar") |> assert_has(".ant-dropdown-menu-item", text: email)

  defp sign_out(conn),
    do:
      conn
      |> click(".ant-dropdown-menu-item", "Sign Out")
      |> refute_has(".ant-dropdown-menu-item", text: "Sign Out")

  defp user(email), do: AuthRepo.get_by!(User, email: email)

  test "the first account claims the instance with a passkey, signs out and back in", %{
    conn: conn
  } do
    conn = conn |> virtual_authenticator() |> visit("/") |> register("admin@example.com")

    assert length(codes(conn)) == 12
    assert length(credentials(conn)) == 1

    assert AuthRepo.get_by(UserAccess,
             user_id: user("admin@example.com").id,
             tag_id: "invitations"
           )

    conn
    |> close_codes()
    |> signed_in_as("admin@example.com")
    |> sign_out()
    |> menu("Sign In")
    |> click_button("Sign in with a passkey")
    |> signed_in_as("admin@example.com")
  end

  test "a recovery code signs in when the passkey is gone", %{conn: conn} do
    conn = conn |> virtual_authenticator() |> visit("/") |> register("lost@example.com")
    [code | _] = codes(conn)

    conn
    |> close_codes()
    |> signed_in_as("lost@example.com")
    |> sign_out()
    |> forget_credentials()
    |> menu("Sign In")
    |> click("a", "Recover account")
    |> type("input[placeholder='Recovery code']", code)
    |> click_button("Use code")
    |> signed_in_as("lost@example.com")
  end

  test "a second passkey is enrolled, renamed in the list and revoked", %{conn: conn} do
    conn = conn |> virtual_authenticator() |> visit("/") |> register("multi@example.com")

    # The page's authenticator forgets the first key: a second device enrolls the next.
    conn
    |> close_codes()
    |> account("Passkeys")
    |> assert_has(".ant-list-item", count: 1)
    |> forget_credentials()
    |> click_button("Add a passkey")
    |> assert_has(".ant-list-item", count: 2)

    assert [_, _] = Passkeys.list_keys(user("multi@example.com"))

    conn
    |> click(".ant-list-item:first-child button", "Remove")
    |> assert_has(".ant-list-item", count: 1)

    assert [_] = Passkeys.list_keys(user("multi@example.com"))
  end

  test "an invitation link registers the invited email", %{conn: conn} do
    conn = conn |> virtual_authenticator() |> visit("/") |> register("host@example.com")

    link =
      conn
      |> close_codes()
      |> account("Manage invitations", "Invitations")
      |> type("input#email", "guest@example.com")
      |> click_button("Create invitation")
      |> assert_has("[data-testid=invite-link]")
      |> value("document.querySelector('[data-testid=invite-link]').innerText.trim()")

    conn
    |> visit("/")
    |> menu("Sign Out")
    |> forget_credentials()
    |> visit(URI.parse(link) |> then(&"#{&1.path}?#{&1.query}"))
    |> type("#register_email", "someone-else@example.com")
    |> click_button("Register with a passkey")
    |> assert_has("[data-testid=recovery-codes]")

    assert user("guest@example.com")
    refute AuthRepo.get_by(User, email: "someone-else@example.com")
  end

  test "password sign-up shows recovery codes, then an authenticator app guards sign in", %{conn: conn} do
    conn =
      conn
      |> visit("/")
      |> menu("Register")
      |> type("#register_email", "totp@example.com")
      |> type("#register_password", "a long enough password")
      |> type("#register_password_confirmation", "a long enough password")
      |> click_button("button[type=submit]", "Register")
      |> assert_has("[data-testid=recovery-codes]")

    assert length(codes(conn)) == 12

    conn =
      conn
      |> close_codes()
      |> account("Authenticator app")
      |> click_button("Set up authenticator app")
      |> assert_has("[data-testid=totp-secret] code")

    secret = conn |> value("document.querySelector('[data-testid=totp-secret] code').innerText") |> Base.decode32!(padding: false)

    conn
    |> type("input[placeholder='123456']", NimbleTOTP.verification_code(secret))
    |> click_button("Verify")
    |> assert_has("button", text: "Remove authenticator app")
    |> click(".account-nav .ant-menu-item", "Two-factor")
    |> click("[data-testid=two-factor-toggle]")
    |> assert_has("[data-testid=two-factor-toggle].ant-switch-checked")

    # The enable step's period is spent only for sign-in, so the current code still works.
    conn
    |> visit("/")
    |> menu("Sign Out")
    |> menu("Sign In")
    |> type("#login_email", "totp@example.com")
    |> type("#login_password", "a long enough password")
    |> click_button("button[type=submit]", "Sign In")
    |> assert_has(".auth-modal-title", text: "Two-factor verification")
    |> type("input[placeholder='123456']", NimbleTOTP.verification_code(secret))
    |> click_button("Verify")
    |> signed_in_as("totp@example.com")
  end
end
`,
    },
    "add_auth_browser_test"
  );

const add_auth_web_test_helper = async ({ WebDir, AppNameCamel }: ApiAppData) =>
  generateFile(
    {
      dir: join(WebDir || "", `test`),
      filename: "test_helper.exs",
      content: `browser_tests? = System.get_env("BROWSER_TESTS") == "1"

ExUnit.start(exclude: [:cluster | if(browser_tests?, do: [], else: [:e2e])])
Ecto.Adapters.SQL.Sandbox.mode(${AppNameCamel}.Repo, :manual)

if browser_tests? do
  cli = Path.expand("../../node_modules/playwright/cli.js", __DIR__)
  args = [cli, "run-server", "--port", "3333", "--host", "127.0.0.1"]
  server = Port.open({:spawn_executable, System.find_executable("node")}, [:binary, args: args])
  {:os_pid, os_pid} = Port.info(server, :os_pid)

  # Closing the port does not stop node on Windows, so kill its process tree.
  ExUnit.after_suite(fn _ ->
    case :os.type() do
      {:win32, _} -> System.cmd("taskkill", ["/PID", "#{os_pid}", "/T", "/F"])
      _ -> System.cmd("kill", ["#{os_pid}"])
    end
  end)

  # Wait for the Playwright server to listen before connecting to it.
  Stream.repeatedly(fn -> Process.sleep(200) && :gen_tcp.connect(~c"127.0.0.1", 3333, []) end)
  |> Stream.take(50)
  |> Enum.find(&match?({:ok, _}, &1))

  Application.put_env(:phoenix_test, :base_url, ${AppNameCamel}Web.Endpoint.url())
  {:ok, _} = PhoenixTest.Playwright.Supervisor.start_link()
end
`,
    },
    "add_auth_web_test_helper"
  );

const add_auth_passkey_requests = async ({ LibDir, AppNameSnake, ApiNameSnake }: ApiAppData) =>
  generateFile(
    {
      dir: join(LibDir || "", `lib/typescript/requests`),
      filename: "Passkeys.tsx",
      content: `/// <reference path="./ithibati.d.ts" />
import type { Dispatch } from "redux";
import { register, authenticate } from "ithibati";
import { setUserdata, setToken } from "../state/User";
import { storeToken } from "./index";
import { authAPI } from "./User";

// Ceremonies keep their challenge in the auth app's session cookie, which authAPI sends.
const post = (path: string, body: object, dispatch?: Dispatch) =>
  authAPI(
    {
      name: \`auth/\${path}\`,
      route: \`auth/\${path}\`,
      options: { method: "POST", body: JSON.stringify(body) },
    },
    dispatch,
  );

const api = (
  path: string,
  method = "GET",
  body?: object,
  dispatch?: Dispatch,
) =>
  authAPI(
    {
      name: \`\${method} \${path}\`,
      route: \`api/\${path}\`,
      options: { method, ...(body ? { body: JSON.stringify(body) } : {}) },
    },
    dispatch,
  );

const signedIn = (dispatch: Dispatch) => (res: any) => {
  if (res.data) dispatch(setUserdata(res.data));
  if (res.token) {
    storeToken(res.token);
    dispatch(setToken(res.token));
  }
  return res as { recovery_codes?: string[]; [key: string]: any };
};

// An invitation token, when present, binds or approves the email server-side.
const registerPasskey = (
  email: string,
  dispatch: Dispatch,
  token?: string | null,
) =>
  post(
    "registration/challenge",
    { email, ...(token ? { token } : {}) },
    dispatch,
  )
    .then(register)
    .then((credential) =>
      post(
        "registration",
        { email, credential, ...(token ? { token } : {}) },
        dispatch,
      ),
    )
    .then(signedIn(dispatch));

const signInWithPasskey = (dispatch: Dispatch) =>
  post("authentication/challenge", {}, dispatch)
    .then(authenticate)
    .then((credential) => post("authentication", { credential }, dispatch))
    .then(signedIn(dispatch));

type Passkey = {
  id: string;
  label: string;
  last_used_at: string | null;
  inserted_at: string;
};

// Signed in: the bearer token makes the server enroll on the current account.
const addPasskey = (label: string) =>
  post("registration/challenge", {})
    .then(register)
    .then((credential) => post("registration", { label, credential }));

const listPasskeys = (): Promise<Passkey[]> =>
  api("users/passkeys").then((res) => res.data);
const renamePasskey = (id: string, label: string) =>
  api(\`users/passkeys/\${id}\`, "PUT", { label });
const deletePasskey = (id: string) => api(\`users/passkeys/\${id}\`, "DELETE");

// Signs in with a single-use code; the last code returns a fresh batch.
const recoverWithCode = (code: string, dispatch: Dispatch) =>
  post("recovery", { code }, dispatch).then(signedIn(dispatch));

const remainingRecoveryCodes = (): Promise<number> =>
  api("users/recovery_codes").then((res) => res.remaining);
const regenerateRecoveryCodes = (): Promise<string[]> =>
  api("users/recovery_codes", "POST").then((res) => res.recovery_codes);

type Invitation = {
  id: string;
  email: string | null;
  note: string | null;
  expires_at: string;
  token?: string;
};

const listInvitations = (): Promise<Invitation[]> =>
  api("invitations").then((res) => res.data);
const createInvitation = (attrs: {
  email?: string;
  note?: string;
}): Promise<Invitation> =>
  api("invitations", "POST", attrs).then((res) => res.data);
const withdrawInvitation = (id: string) => api(\`invitations/\${id}\`, "DELETE");
const inviteLink = (token: string) =>
  \`\${window.location.origin}/?invite=\${token}\`;

// The operator code from \`mix ${AppNameSnake}_${ApiNameSnake}.setup_code\` unlocks the first sign-up.
const authorizeSetup = (code: string) => post("setup", { code });

export {
  api,
  signedIn,
  authorizeSetup,
  listInvitations,
  createInvitation,
  withdrawInvitation,
  inviteLink,
  recoverWithCode,
  remainingRecoveryCodes,
  regenerateRecoveryCodes,
  registerPasskey,
  signInWithPasskey,
  addPasskey,
  listPasskeys,
  renamePasskey,
  deletePasskey,
};
export type { Passkey, Invitation };
`,
    },
    "add_auth_passkey_requests"
  );

const add_auth_ithibati_types = async ({ LibDir }: ApiAppData) =>
  generateFile(
    {
      dir: join(LibDir || "", `lib/typescript/requests`),
      filename: "ithibati.d.ts",
      content: `declare module "ithibati" {
  export function register(options: unknown): Promise<unknown>;
  export function authenticate(options: unknown): Promise<unknown>;
}
`,
    },
    "add_auth_ithibati_types"
  );

const add_auth_recovery_codes = async ({ LibDir }: ApiAppData) =>
  generateFile(
    {
      dir: join(LibDir || "", `lib/typescript/components/auth`),
      filename: "RecoveryCodes.tsx",
      content: `import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button, Space, Typography, message } from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { AuthModal } from "./AuthModal";

const download = (codes: string[]) => {
  const url = URL.createObjectURL(
    new Blob([codes.join("\\n") + "\\n"], { type: "text/plain" }),
  );
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: "recovery-codes.txt",
  });
  link.click();
  URL.revokeObjectURL(url);
};

const copy = (codes: string[]) =>
  navigator.clipboard
    .writeText(codes.join("\\n"))
    .then(() => message.success("Recovery codes copied"));

// Codes in a two-column grid of tiles, with copy and download
export const RecoveryCodeList = ({ codes }: { codes: string[] }) => (
  <div className="recovery-codes">
    <ol className="recovery-codes-grid" data-testid="recovery-codes">
      {codes.map((code) => (
        <li
          key={code}
          title="Click to copy this code"
          onClick={() =>
            navigator.clipboard
              .writeText(code)
              .then(() => message.success("Code copied"))
          }
        >
          {code}
        </li>
      ))}
    </ol>
    <Space wrap>
      <Button icon={<CopyOutlined />} onClick={() => copy(codes)}>
        Copy
      </Button>
      <Button icon={<DownloadOutlined />} onClick={() => download(codes)}>
        Download
      </Button>
    </Space>
  </div>
);

const RecoveryCodesModal = ({
  codes,
  onClose,
}: {
  codes: string[];
  onClose: () => void;
}) => {
  const [open, setOpen] = useState(true);
  const close = () => {
    setOpen(false);
    onClose();
  };

  return (
    <AuthModal title="Recovery codes" visible={open} onCancel={close}>
      <Typography.Paragraph type="secondary">
        Each code signs you in once if you lose your passkeys or password. They
        won't be shown again; you can make new ones under Account → Security →
        Recovery codes.
      </Typography.Paragraph>
      <RecoveryCodeList codes={codes} />
      <Button
        type="primary"
        block
        onClick={close}
        className="recovery-codes-done"
      >
        I've saved them
      </Button>
    </AuthModal>
  );
};

// Codes are only ever shown once, right after they are issued. Rendered in its own root
// so callers can show it from a request callback, with the same theme as the auth modals.
export const showRecoveryCodes = (codes?: string[]) => {
  if (!codes?.length) return;
  const host = document.body.appendChild(document.createElement("div"));
  const root = createRoot(host);
  // Unmount after the close animation
  const onClose = () =>
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 300);
  root.render(<RecoveryCodesModal codes={codes} onClose={onClose} />);
};
`,
    },
    "add_auth_recovery_codes"
  );

export {
  add_auth_passkey_handler,
  add_auth_invitation_schema,
  add_auth_passkey_json_controller,
  add_auth_recovery_code_json_controller,
  add_auth_invitation_json_controller,
  add_auth_setup_json_controller,
  add_auth_setup_code_task,
  add_auth_credo,
  add_auth_ithibati_helpers,
  add_auth_sessions_test,
  add_auth_ceremony_test,
  add_auth_passkey_management_test,
  add_auth_recovery_codes_test,
  add_auth_invitations_test,
  add_auth_operator_guard_test,
  add_auth_browser_test,
  add_auth_web_test_helper,
  add_auth_passkey_requests,
  add_auth_ithibati_types,
  add_auth_recovery_codes,
};
