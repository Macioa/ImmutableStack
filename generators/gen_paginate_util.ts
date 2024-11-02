const content4 = `
defmodule Hello.Utils.Paginate do
  @doc """
  Utility functions for pagination with Scriniver Lib.
  """

  def apply(query, repo, pagination_options \\ %{}) do
    page = repo.paginate(query, default(pagination_options))
    res = page |> Map.get(:entries)
    params = Map.drop(page, [:entries])

    {:ok, res, Map.from_struct(params)}
  end

  def default(opts) do
    %{
      page: 1,
      page_size: 100,
      max_page_size: 1000
    }
    |> Map.merge(opts)
  end

  def split_page_opts(opts) do
    page_opts = ["page", "page_size", "max_page_size", "filter", "select", "sort"]

    {Map.drop(opts, page_opts), Map.take(opts, page_opts)}
  end
end
`