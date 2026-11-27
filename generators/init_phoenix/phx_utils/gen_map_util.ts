import { join } from "../../../utils/path";
import { generateFile } from "../../index";
import { AppData } from "../../../readers/get_app_data";

const gen_map_util = async ({ AppNameCamel, LibDir }: AppData) => {
  const utilsPath = join(LibDir || "", "/lib/utils");

  const content = `
defmodule ${AppNameCamel}.Utils.MapUtil do
  def get(map, key, default \\\\ nil),
    do: Map.get(map, key, false) || Map.get(map, Atom.to_string(key), default)

  def id_list_from(list) when is_list(list) do
    Enum.map(list, fn 
      s when is_binary(s) -> s; 
      m when is_map(m) -> get(m, :id);
    end)
  end
end
`;

  return generateFile(
    { dir: utilsPath, filename: "map.ex", content },
    "gen_map_util"
  );
};

export { gen_map_util };
