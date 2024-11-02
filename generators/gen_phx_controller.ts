const content5 = `
defmodule HelloWeb.BooController do
  use HelloWeb, :controller
  plug Hello.Plugs.ListAsJSON

  alias Hello.Utils.Paginate
  alias Hello.Utils.MapUtil

  alias Hello.BAB.BooText
  alias Hello.BAB.BooText.BAB.Boo

  action_fallback HelloWeb.FallbackController

  def index(conn, params) do
    {entity_queries, page_queries} = Paginate.split_page_opts(params)
    routed_index(conn, entity_queries, page_queries)
  end

  defp routed_index(conn, custom, query) when custom == %{} do
    with {:ok, boos, query} <- BooText.list_boos(query) do
      render(conn, :show, boos: boos, query_data: query)
    end
  end

  defp routed_index(conn, custom, standard) when custom != %{} do
    with {:ok, boos, query} <- BooText.list_boos_by(custom, standard) do
      render(conn, :show, boos: boos, query_data: query)
    end
  end

  def create(conn, boo_list) when is_list(boo_list) do
    with {:ok, boos, []} <- BooText.create_boo(boo_list) do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/boos/:id")
      |> render(:show, boos: boos)
    else
      {:partial_success, created_boos, failed_boos} ->
        conn
        |> put_status(:partial_content)
        |> render(:show_partial, succeeded: created_boos, failed: failed_boos)

      error ->
        HelloWeb.FallbackController.call(conn, error)
    end
  end

  def create(conn, boo_params) do
    with {:ok, %Boo{} = boo} <- boo_params |> MapUtil.str_to_atom() |> BooText.create_boo() do
      conn
      |> put_status(:created)
      |> put_resp_header("location", ~p"/api/boos/#{boo}")
      |> render(:show, boo: boo)
    end
  end

  def show(conn, boos) when is_list(boos) do
    boos = BooText.get_boo!(Enum.map(boos, &Map.get(&1, "id", nil)))
    render(conn, :show, boos: boos)
  end

  def show(conn, boo) do
    boo = BooText.get_boo!(boo.id)
    render(conn, :show, boo: boo)
  end

  def update(conn, boos) when is_list(boos) do
    with {:ok, boos, []} <- BooText.update_boo(boos) do
      render(conn, :show, boos: boos)
    else
      {:partial_success, updated_boos, failed_boos} ->
        conn
        |> put_status(:partial_content)
        |> render(:show_partial, succeeded: updated_boos, failed: failed_boos)

      error ->
        HelloWeb.FallbackController.call(conn, error)
    end

    render(conn, :show, boos: boos)
  end

  def update(conn, boo_params) when is_map(boo_params) do
    with {:ok, %Boo{} = boo} <- BooText.update_boo(boo_params) do
      render(conn, :show, boo: boo)
    end
  end

  def delete(conn, boos) when is_list(boos) do
    with {:ok, count, _} <- BooText.delete_boo(boos) do
      render(conn, :show, count: count)
    else
      {:partial_success, success_count, fail_count} ->
        conn
        |> put_status(:partial_content)
        |> render(:show_partial, succeess_count: success_count, fail_count: fail_count)

      e ->
        HelloWeb.FallbackController.call(conn, e)
    end
  end

  def delete(conn, %{"id" => id}) do
    with {:ok, %Boo{}} <- BooText.delete_boo(id) do
      send_resp(conn, :no_content, "")
    end
  end
end
`