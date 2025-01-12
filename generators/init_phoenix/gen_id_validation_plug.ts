import { join } from "path";
import { generateFile } from "../index";

const gen_id_validation_plug = async (AppNameCamel: string, LibDir: string) => {
  const plug_path = join(LibDir, `/lib/mix/plugs/`);

  const content = `
defmodule ${AppNameCamel}.Plugs.ValidateBinaryId do
  import Plug.Conn
  alias Ecto.UUID

  def init(opts) do
    case Keyword.get(opts, :fallback) do
      controller ->
        case Code.ensure_loaded?(controller) do
          true -> opts
          _ -> {:error, :validate_fallback_controller_not_loaded}
        end

      _ ->
        {:error, :validate_requires_fallback_controller}
    end
  end

  def call(conn, opts) do
    with id when not is_nil(id) <- Map.get(conn.params, "id"),
         {:ok, _} <- UUID.cast(id) do
      conn
    else
      nil -> conn
      _ ->
        controller = Keyword.get(opts, :fallback, ${AppNameCamel}Web.FallbackController)

        conn
        |> put_private(:plug_error, %{
          status: :bad_request,
          message: "Unable to cast id as UUID"
        })
        |> controller.call
    end
  end
end
`;

  return generateFile(
    {
      dir: plug_path,
      filename: "validate_uuid.ex",
      content,
    },
    "gen_id_validation_plug"
  );
};

export { gen_id_validation_plug };
