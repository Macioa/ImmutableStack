import { join } from "../../utils/path";
import { generateFile } from "..";
import { AppData } from "../../readers/get_app_data";

const gen_cluster_monitor = async ({ LibDir, AppNameCamel }: AppData) => {
  const filename = "cluster_monitor.ex";
  const dir = join(LibDir || "", "lib", AppNameCamel.toLowerCase());
  const content = `defmodule ${AppNameCamel}.ClusterMonitor do
  @moduledoc """
  Monitors cluster node events and emits telemetry.
  """
  use GenServer

  def start_link(opts \\\\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    :net_kernel.monitor_nodes(true)
    {:ok, %{}}
  end

  def handle_info({:nodeup, node}, state) do
    :telemetry.execute([:${AppNameCamel.toLowerCase()}, :cluster, :nodeup], %{count: 1}, %{node: node})
    {:noreply, state}
  end

  def handle_info({:nodedown, node}, state) do
    :telemetry.execute([:${AppNameCamel.toLowerCase()}, :cluster, :nodedown], %{count: 1}, %{node: node})
    {:noreply, state}
  end
end`;

  return generateFile({ filename, dir, content }, "gen_cluster_monitor");
};

export { gen_cluster_monitor };
