const content1 = `defmodule Hello.BAB.BooText do
  @moduledoc """
  The BAB.BooText context.
  """

  import Ecto.Query, warn: false

  alias Ecto.Multi
  alias Hello.Repo
  alias Hello.Utils.DynamicQuery
  alias Hello.Utils.Paginate
  alias Hello.Utils.Chunk
  alias Hello.Utils.MapUtil

  alias Hello.BAB.BooText.BAB.Boo

  @doc """
  Returns the list of boos.

  ## Examples
      iex> list_boos()
      [%Boo{}, ...]

  """
  def list_boos(page_query \\ %{}), do: Paginate.apply(Boo, Repo, page_query)

  @doc """
  Use a Dynamic Query to get a list of boos with specific values for any directly queryable fields.
  """
  def list_boos_by(entity_queries, page_queries \\ %{}) do
    with {:ok, query, entity_queries} <- DynamicQuery.by_schema(entity_queries, Boo),
         {:ok, result, page_queries} <- Paginate.apply(query, Repo, page_queries) do
      {:ok, result, Map.put(entity_queries, :page, page_queries)}
    end
  end

  @doc """
  get_boo!(ids) when is_list(ids) -> Gets specified boos.

  ## Examples

      iex> get_boo!([123, 456])
      [%Boo{}, %Boo{}]
      %Boo{}

  get_boo!(id) -> Gets a single boo.
      Raises \`Ecto.NoResultsError\` if the Boo does not exist.

  ## Examples
      iex> get_boo!(123)
      %Boo{}
      iex> get_boo!(456)
      ** (Ecto.NoResultsError)

  """
  def get_boo!(boos) when is_list(boos) do
    ids =
      Enum.map(boos, fn
        id when is_binary(id) -> id
        boo when is_map(boo) -> MapUtil.get(boo, :id)
      end)

    from(b in Boo, where: b.id in ^ids)
    |> Repo.all()
  end

  def get_boo!(id) when is_binary(id), do: Repo.get!(Boo, id)

  def get_boo!(%Boo{} = boo), do: Repo.get!(Boo, boo.id)

  @doc """
  create_boo(attrs) when is_list attrs -> Creates boos from an array of attrs.

  ## Examples
      iex> create_boo([%{field: value}, %{field: value}])
      {:ok, [%Boo{}, %Boo{}]}

  create_boo(attrs \\ %{}) -> Creates a boo.

  ## Examples
      iex> create_boo(%{field: value})
      {:ok, %Boo{}}
      iex> create_boo(%{field: bad_value})
      {:error, %Ecto.Changeset{}}

  """
  def create_boo(attrs \\ %{})

  def create_boo(attrs) when is_list(attrs) do
    attrs
    |> Chunk.apply(fn attr_chunk ->
      changesets =
        attr_chunk
        |> Enum.map(&Boo.changeset(%Boo{}, &1))

      case Enum.split_with(changesets, & &1.valid?) do
        {valid, []} ->
          created = Chunk.prep(valid)
          {_, result} = Repo.insert_all(Boo, created, returning: true)
          {:ok, result, []}

        {[], invalid} ->
          {:error, [], invalid}

        {valid, invalid} ->
          created = Chunk.prep(valid)
          {_, result} = Repo.insert_all(Boo, created, returning: true)
          {:partial_success, result, invalid}
      end
    end)
    |> Chunk.flat_reduce()
  end

  def create_boo(attrs) when is_map(attrs) do
    changeset = change_boo(attrs)
    if changeset.valid?, do: Repo.insert(changeset)
  end

  @doc """
  update_boo(boos) when is_list boos -> Updates boos with an array of tuples [{boo, attrs}].

  ## Examples
      iex> update_boo([{%{field: new_value}}, {%{field: new_value}}])
      {:ok, [%Boo{}, %Boo{}]}

  update_boo(%Boo{} = boo, attrs) -> Updates a boo.

  ## Examples
      iex> update_boo(boo, %{field: new_value})
      {:ok, %Boo{}}
      iex> update_boo(boo, %{field: bad_value})
      {:error, %Ecto.Changeset{}}
  """
  def update_boo(boos) when is_list(boos) do
    boos
    |> Chunk.apply(fn boo_chunk ->
      multi =
        Multi.new()
        |> Multi.run(:initial_query, fn repo, _ ->
          requested_ids = Enum.map(boo_chunk, &MapUtil.get(&1, :id))

          found_boos = from(b in Boo, where: b.id in ^requested_ids) |> repo.all()
          found_ids = Enum.map(found_boos, & &1.id)
          unfound_ids = requested_ids -- found_ids

          {matched_attrs, unmatched_attrs} =
            Enum.split_with(boo_chunk, fn attrs -> MapUtil.get(attrs, :id) not in unfound_ids end)

          changesets =
            Enum.zip(found_boos, matched_attrs)
            |> Enum.map(fn {boo, attrs} -> change_boo(boo, attrs) end)
            |> Enum.filter(& &1.valid?)

          {:ok, %{changesets: changesets, unmatched: unmatched_attrs}}
        end)
        |> Multi.run(:updates, fn repo, %{initial_query: query_res} ->
          %{
            changesets: changesets,
            unmatched: unmatched_attrs
          } = query_res

          {succeeded, failed_updates} =
            changesets
            |> Enum.map(&repo.update/1)
            |> Enum.reduce({[], []}, fn
              {:ok, boo}, {s, f} -> {[boo | s], f}
              {_, changeset}, {s, f} -> [s, changeset | f]
            end)

          {:ok, %{succeeded: succeeded, failed: failed_updates ++ unmatched_attrs}}
        end)

      {:ok, %{updates: updates}} = Repo.transaction(multi)
      %{succeeded: succeeded, failed: failed} = updates

      case {succeeded, failed} do
        {succeeded, []} -> {:ok, succeeded, []}
        {[], failed} -> {:error, [], failed}
        {succeeded, failed} -> {:partial_success, succeeded, failed}
      end
    end)
    |> Chunk.flat_reduce()
  end

  def update_boo(attrs) when is_map(attrs) do
    changeset =
      MapUtil.get(attrs, :id)
      |> get_boo!()
      |> change_boo(attrs)

    if changeset.valid?, do: Repo.update(changeset)
  end

  @doc """
  Deletes a boo.

  ## Examples
      iex> delete_boo(boo)
      {:ok, %Boo{}}
      iex> delete_boo(boo)
      {:error, %Ecto.Changeset{}}

  Deletes boos.

  ## Examples
      iex> delete_boo([boo, boo])
      {:ok, [%Boo{}, %Boo{}]}
  """
  def delete_boo(boos) when is_list(boos) do
    result =
      boos
      |> Chunk.apply(fn boo_chunk ->
        ids =
          Enum.map(boo_chunk, fn
            id when is_binary(id) -> id
            boo when is_map(boo) -> MapUtil.get(boo, :id)
          end)

        {count, _} =
          from(b in Boo, where: b.id in ^ids)
          |> Repo.delete_all()

        case count do
          0 -> {:error, 0, length(ids)}
          count when count == length(ids) -> {:ok, count, 0}
          _ -> {:partial_success, count, length(ids) - count}
        end
      end)
      |> Chunk.flat_reduce()

    if elem(result, 0) == :error,
      do: {:error, :not_found},
      else: result
  end

  def delete_boo(%Boo{} = boo), do: Repo.delete(boo)

  def delete_boo(id) when is_binary(id), do: Repo.delete!(Boo, id)

  @doc """
  change_boo(boos) when is_list boos -> Returns a list of \`%Ecto.Changeset{}\` for tracking boo changes

  ## Examples
      iex> change_boo([{boo1, attrs1}, {boo2, attrs2}])
      %Ecto.Changeset{data: [%Boo{}, %Boo{}]}

  change_boo(%Boo{} = boo, attrs \\ %{}) -> Returns \`%Ecto.Changeset{}\` for tracking boo changes.

  ## Examples
      iex> change_boo(boo)
      %Ecto.Changeset{data: %Boo{}}

  """
  def change_boo(attrs \\ %{})
  def change_boo(attrs) when is_map(attrs), do: change_boo(%Boo{}, attrs)

  def change_boo(boos) when is_list(boos),
    do:
      Enum.map(boos, fn
        {boo, attr} -> change_boo(boo, attr)
        attr when is_map(attr) -> change_boo(attr)
      end)

  def change_boo(%Boo{} = boo, attrs), do: Boo.changeset(boo, attrs)
end
`