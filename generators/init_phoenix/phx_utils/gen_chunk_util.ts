import { join } from "path";
import { generateFile } from "../../index";

const gen_chunk_util = async (AppNameCamel: string, AppDir: string) => {
  const utilsPath = join(AppDir || "", "/lib/utils");

  const content = `
defmodule ${AppNameCamel}.Utils.Chunk do
  @size 1000

  @doc """
  Applies a function to a list in chunks with specified or default chunk size.
  """
  def apply(list, fun, size \\\\ @size) do
    list
    |> Enum.chunk_every(size)
    |> Enum.map(&fun.(&1))
  end

  @doc """
  Given a chunked list of :ok, :partial_success, or :error tuples, in
  {:status, succeeded_list, failed_list} or
  {:status, success_count, fail_count} format,
  reduce the result lists, counts, and status to summarize the entire operation.
  """
  def flat_reduce(chunked_tuples) do
    case List.first(chunked_tuples) do
      {status, s, f} when is_atom(status) and is_list(s) and is_list(f) ->
        chunked_tuples
        |> Enum.reduce({:ok, [], []}, fn
          # {:status, created [], invalid []}
          # destructured chunk, destructured accumulator -> accumulated result
          {:ok, c, []}, {:ok, csum, []} -> {:ok, csum ++ c, []}
          {:ok, c, []}, {_, csum, isum} -> {:partial_success, csum ++ c, isum}
          {:partial_success, c, i}, {_, csum, isum} -> {:partial_success, csum ++ c, isum ++ i}
          {:error, [], i}, {_, [], isum} -> {:error, [], isum ++ i}
          {:error, [], i}, {_, csum, isum} -> {:partial_success, csum, isum ++ i}
        end)

      {status, s, f} when is_atom(status) and is_integer(s) and is_integer(f) ->
        chunked_tuples
        |> Enum.reduce({:ok, 0, 0}, fn
          # {:status, succeeded 0, failed 0}
          # destructured chunk, destructured accumulator -> accumulated result
          {:ok, s, 0}, {:ok, ssum, 0} -> {:ok, ssum + s, 0}
          {:ok, s, 0}, {_, ssum, fsum} -> {:partial_success, ssum + s, fsum}
          {:partial_success, s, f}, {_, ssum, fsum} -> {:partial_success, ssum + s, fsum + f}
          {:error, 0, f}, {_, 0, fsum} -> {:error, 0, fsum + f}
          {:error, 0, f}, {_, ssum, fsum} -> {:partial_success, ssum, fsum + f}
        end)
    end
  end

  @doc """
  Given a list of records, prep the chunk for bulk db edits
  """
  def prep(changesets, opts \\\\ %{}) do
    def_opts = %{
      inserted_at?: true
    }

    %{inserted_at?: inserted} = Map.merge(def_opts, opts)
    timestamp = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    changesets
    |> Enum.map(& &1.changes)
    |> Enum.map(fn record ->
      new_properties =
        case [inserted] do
          [true] -> Map.merge(record, %{inserted_at: timestamp, updated_at: timestamp})
          [false] -> Map.delete(record, :inserted_at) |> Map.merge(%{updated_at: timestamp})
        end

      Map.merge(record, new_properties)
    end)
  end
end
`;

  return generateFile({ dir: utilsPath, filename: "chunk.ex", content });
};

export { gen_chunk_util };
