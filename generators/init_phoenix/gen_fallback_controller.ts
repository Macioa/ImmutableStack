import { join } from "path";
import { CommentType, mark } from "../../repair";
import { StringOnlyMap } from "../../utils/map";
import { generateFile } from "../index";

const gen_fallback_controller = async ({
  WebDir,
  AppNameCamel,
  AppNameSnake,
}: StringOnlyMap) => {
  const fallbackControllerPath = join(
    WebDir || ".",
    `lib/${AppNameSnake}_web/controllers`
  );

  const contentInit = `
defmodule ${AppNameCamel}Web.FallbackController do
  @moduledoc """
  Translates controller action results into valid \`Plug.Conn\` responses.

  See \`Phoenix.Controller.action_fallback/1\` for more details.
  """
  use ${AppNameCamel}Web, :controller

  alias Ecto.Changeset

  # This clause handles errors returned by Ecto's insert/update/delete.
  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(error_transform(changeset))
  end

  def call(conn, {:error, [], failed_changesets}) when is_list(failed_changesets) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: error_transform(failed_changesets)})
  end

  # This clause is an example of how to handle resources that cannot be found.
  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(html: ${AppNameCamel}Web.ErrorHTML, json: ${AppNameCamel}Web.ErrorJSON)
    |> render(:"404")
  end

  def call(conn, {:error, status, error}) when is_atom(error) do
    conn
    |> put_status(status)
    |> json(%{error: Atom.to_string(error)})
  end

  def call(%Plug.Conn{private: %{plug_error: %{status: status, message: message}}} = conn) do
    conn
    |> put_status(status)
    |> json(%{error: message})
  end

  def error_transform(changesets) when is_list(changesets),
    do: changesets |> Enum.map(&error_transform/1)

  def error_transform(%Changeset{} = cs) do
    errors =
      Enum.reduce(cs.errors, %{}, fn {key, {reason, _}}, acc -> Map.put(acc, key, reason) end)

    Map.put(cs.changes, :errors, errors)
  end
end
`;

  const content = mark(
    { str: contentInit, type: "FALLBACK_CONTROLLER" },
    "EX" as CommentType
  );

  return generateFile(
    {
      dir: fallbackControllerPath,
      filename: "fallback_controller.ex",
      content,
    },
    "gen_fallback_controller"
  );
};

export { gen_fallback_controller };
