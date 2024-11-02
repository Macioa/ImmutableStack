import { join } from "path";
import { generateFile } from "../index";

const gen_map_util = async (AppNameCamel: string, AppDir: string) => {
  const utilsPath = join(AppDir || "", "/lib/utils");

  const content = `
defmodule ${AppNameCamel}.Utils.MapUtil do
  def get(map, key, default \\\\ nil),
    do: Map.get(map, key, false) || Map.get(map, Atom.to_string(key), default)

  def str_to_atom(map),
    do:
      Map.keys(map)
      |> Enum.reduce(%{}, fn key, acc -> Map.put(acc, to_atom(key), Map.get(map, key)) end)

  defp to_atom(string) when is_binary(string), do: String.to_atom(string)
  defp to_atom(atom) when is_atom(atom), do: atom
end
`;

  return generateFile({ dir: utilsPath, filename: "map.ex", content });
};

export { gen_map_util };
