import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "../add_api";

const add_auth_require_access_plug = async ({
  AppDir,
  AppNameSnake,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/lib/${apiAppName}/plugs`);
  const filename = "require_access.ex";
  const content = `defmodule ${ApiNameCamel}.Plugs.RequireAccess do
  @moduledoc """
  Restricts routes to users holding any of the listed access tags or groups.

  Plain entries are tags. Use \`group:\` for a tag group. Run it after
  \`:fetch_current_user\`, inside a pipeline:

      pipeline :billing do
        plug ${ApiNameCamel}.Plugs.RequireAccess, ["billing:read", :finance, group: "admins"]
      end

      scope "/api/billing", ${ApiNameCamel} do
        pipe_through [:api, :billing]
        get "/invoices", InvoiceController, :index
      end

  Responds 401 without a user and 403 without a matching grant.
  """
  @behaviour Plug

  import Plug.Conn
  import Phoenix.Controller, only: [get_format: 1, json: 2]

  alias ${ApiNameCamel}.Accounts

  @impl Plug
  def init([_ | _] = requirements) do
    requirements
    |> Enum.map(&normalize/1)
    |> Enum.group_by(&elem(&1, 0), &elem(&1, 1))
    |> then(&%{tags: Map.get(&1, :tag, []), groups: Map.get(&1, :group, [])})
  end

  def init(other), do: invalid!(other)

  @impl Plug
  def call(%{assigns: %{current_user: %{} = user}} = conn, %{tags: tags, groups: groups}) do
    case Accounts.user_has_access?(user, tags, groups) do
      true -> conn
      false -> deny(conn, :forbidden, "Forbidden")
    end
  end

  def call(conn, _requirements), do: deny(conn, :unauthorized, "Not authenticated")

  defp normalize({type, name}) when type in [:tag, :group], do: {type, name_string(name)}
  defp normalize(name), do: {:tag, name_string(name)}

  defp name_string(name) when is_binary(name) and byte_size(name) > 0, do: name

  defp name_string(name) when is_atom(name) and name not in [nil, true, false],
    do: Atom.to_string(name)

  defp name_string(name), do: invalid!(name)

  defp invalid!(value) do
    raise ArgumentError,
          "RequireAccess expects a non-empty list of tags or group: entries, got: #{inspect(value)}"
  end

  defp deny(conn, status, message), do: conn |> respond(get_format(conn), status, message) |> halt()

  defp respond(conn, "json", status, message),
    do: conn |> put_status(status) |> json(%{error: message})

  defp respond(conn, _format, status, message),
    do: conn |> put_resp_content_type("text/plain") |> send_resp(status, message)
end
`;

  return generateFile({ dir, filename, content }, "add_auth_require_access_plug");
};

const add_auth_require_access_test = async ({
  AppDir,
  AppNameSnake,
  AppNameCamel,
  ApiNameSnake,
  ApiNameCamel,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const dir = join(AppDir || "", `${apiAppName}/test/${apiAppName}/plugs`);
  const filename = "require_access_test.exs";
  const content = `defmodule ${ApiNameCamel}.Plugs.RequireAccessTest do
  use ExUnit.Case, async: true

  import Plug.Conn
  import Phoenix.ConnTest, only: [build_conn: 0]

  alias ${AppNameCamel}.AuthRepo, as: Repo
  alias ${ApiNameCamel}.Accounts
  alias ${ApiNameCamel}.Accounts.{AccessGroup, AccessTag, GroupTag, UserAccess}
  alias ${ApiNameCamel}.Plugs.RequireAccess

  setup do
    :ok = Ecto.Adapters.SQL.Sandbox.checkout(Repo)
    ["reports", "billing", "other"] |> Enum.each(&Repo.insert!(%AccessTag{name: &1}))
    Repo.insert!(%AccessGroup{name: "admins"})
    Repo.insert!(%GroupTag{group_id: "admins", tag_id: "billing"})
    {:ok, user: user()}
  end

  defp user do
    {:ok, user} =
      Accounts.register_user(%{
        email: "user#{System.unique_integer([:positive])}@example.com",
        password: "a valid long password"
      })

    user
  end

  defp grant(user, tag, group \\\\ nil),
    do: Repo.insert!(%UserAccess{user_id: user.id, tag_id: tag, group_id: group})

  defp run(user, requirements, format \\\\ "json") do
    build_conn()
    |> Phoenix.Controller.put_format(format)
    |> assign(:current_user, user)
    |> RequireAccess.call(RequireAccess.init(requirements))
  end

  test "allows a direct tag", %{user: user} do
    grant(user, "reports")
    refute run(user, ["billing", "reports"]).halted
  end

  test "allows atom tags", %{user: user} do
    grant(user, "reports")
    refute run(user, [:reports]).halted
  end

  test "allows a group member", %{user: user} do
    grant(user, "billing", "admins")
    refute run(user, ["other", group: "admins"]).halted
  end

  test "a tag held through a group satisfies a tag requirement", %{user: user} do
    grant(user, "billing", "admins")
    refute run(user, ["billing"]).halted
  end

  test "a direct tag does not imply group membership", %{user: user} do
    grant(user, "billing")
    assert run(user, [group: "admins"]).status == 403
  end

  test "ignores grants whose tag left the group", %{user: user} do
    grant(user, "reports", "admins")
    assert run(user, ["reports"]).status == 403
    assert run(user, [group: "admins"]).status == 403
  end

  test "ignores another user's grants", %{user: user} do
    grant(user(), "reports")
    assert run(user, ["reports"]).status == 403
  end

  test "returns 403 json without leaking requirements", %{user: user} do
    conn = run(user, ["reports"])
    assert conn.halted
    assert conn.status == 403
    assert conn.resp_body == ~s({"error":"Forbidden"})
  end

  test "returns plain text for html", %{user: user} do
    conn = run(user, ["reports"], "html")
    assert conn.status == 403
    assert conn.resp_body == "Forbidden"
  end

  test "returns 401 without a user" do
    conn = run(nil, ["reports"])
    assert conn.halted
    assert conn.status == 401
  end

  test "rejects empty or invalid requirements" do
    [[], nil, [""], [nil], [true], [group: ""], [123]]
    |> Enum.each(&assert_raise(ArgumentError, fn -> RequireAccess.init(&1) end))
  end
end
`;

  return generateFile({ dir, filename, content }, "add_auth_require_access_test");
};

const add_auth_plug = async (apiAppData: ApiAppData) => {
  const files = await Promise.all([
    add_auth_require_access_plug(apiAppData),
    add_auth_require_access_test(apiAppData),
  ]);

  return files.flat();
};

export { add_auth_plug };
