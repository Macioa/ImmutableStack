import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_vite_supervisor = async ({
  AppNameSnake,
  AppNameCamel,
  LibDir,
}: AppData, uiName: string = 'ui') => {
  const supervisorPath = join(LibDir, `/lib/mix/processes/`);

  const content = `
if Mix.env() == :dev do
defmodule ${AppNameCamel}.ViteDevSupervisor do
  use GenServer

  @ui_names ["${uiName}"]
  @timeout_sec 10
  @type state :: %{
          vite_servers: %{String.t() => nil | Port.t()},
          existing_vite_pids: [Integer.t()],
          timeout: nil | PID.t()
        }
  @init_state %{vite_servers: %{}, existing_vite_pids: [], timeout: nil}

  def init_state(map) when is_map(map), do: Map.merge(@init_state, map)

  def start_link(_), do: GenServer.start(__MODULE__, nil, name: __MODULE__)

  @impl true
  def init(_) do
    existing_vite_pids = get_vite_processes()
    Process.flag(:trap_exit, true)
    Process.link(self())

    # Kill existing vite servers for all UIs
    Enum.each(@ui_names, fn ui_name ->
      Process.whereis(String.to_atom("vite_server_#{ui_name}")) |> kill
    end)

    state =
      %{existing_vite_pids: existing_vite_pids}
      |> init_state()
      |> start_all_dev_servers()
      |> start_timeout()

    # Start periodic health checks
    Process.send_after(self(), :restart, @timeout_sec * 1000)

    # Start orphan monitor to ensure cleanup even if CTRL+C doesn't reach us
    start_orphan_monitor()

    {:ok, state}
  end

  @impl true
  def terminate(_reason, state) do
    IO.puts("[ViteDevSupervisor] terminate called")

    if state.timeout, do: Task.shutdown(state.timeout)

    cleanup_all_vite_processes()
    IO.puts("[ViteDevSupervisor] cleanup complete")
    :ok
  end

  @impl true
  def handle_info(:restart, state) do
    # Check if servers are still alive and only restart if needed
    alive_servers = filter_alive_servers(state.vite_servers)
    dead_count = map_size(state.vite_servers) - map_size(alive_servers)

    if dead_count > 0 do
      IO.puts("[ViteDevSupervisor] Detected #{dead_count} dead server(s), restarting...")
      Process.send_after(self(), :restart, @timeout_sec * 1000)
      {:noreply, restart_timeout(%{state | vite_servers: alive_servers})}
    else
      # All servers healthy, just reschedule check
      Process.send_after(self(), :restart, @timeout_sec * 1000)
      {:noreply, state}
    end
  end

  def handle_info({_port, {:data, data}}, state) do
    # Forward stdout/stderr to console
    IO.write(data)
    {:noreply, state}
  end

  def handle_info({:EXIT, port, _reason}, %{vite_servers: servers} = state) when is_port(port) do
    # Server died, trigger immediate restart check
    Process.send_after(self(), :restart, 0)
    new_servers = servers |> Enum.reject(fn {_, p} -> p == port end) |> Enum.into(%{})
    {:noreply, %{state | vite_servers: new_servers}}
  end

  def handle_info({:EXIT, pid, _reason}, state) when pid == self() do
    IO.puts("[ViteDevSupervisor] GenServer exiting, cleaning up")
    cleanup_all_vite_processes()
    {:stop, :normal, state}
  end

  def handle_info({ref, _result}, %{timeout: %Task{ref: ref}} = state), do: {:noreply, state}

  def handle_info({:DOWN, ref, :process, _pid, _reason}, %{timeout: %Task{ref: ref}} = state),
    do: {:noreply, state}

  def handle_info(msg, state) do
    IO.inspect(msg, label: :unhandled_info)
    {:noreply, state}
  end

  defp restart_timeout(state = %{timeout: timeout}) do
    # Only start servers if we don't have any alive ones
    alive_servers = filter_alive_servers(state.vite_servers)
    has_live_servers = map_size(alive_servers) > 0

    if has_live_servers do
      # Just update the state with alive servers, no restart needed
      %{state | vite_servers: alive_servers}
    else
      # No live servers, restart them and setup timeout
      next_state = if timeout, do: cancel_timeout(state), else: state
      restarted_state = next_state |> start_all_dev_servers()
      IO.puts("[ViteDevSupervisor] Restarted all vite servers")
      start_timeout(restarted_state)
    end
  end

  defp filter_alive_servers(servers) do
    servers |> Enum.filter(fn {_, port} -> alive_port?(port) end) |> Enum.into(%{})
  end

  defp alive_port?(nil), do: false

  defp alive_port?(port) do
    info = Port.info(port)
    info != nil && Keyword.get(info, :os_pid) != nil
  end

  defp start_all_dev_servers(state) do
    new_servers =
      Enum.reduce(@ui_names, %{}, fn ui_name, acc ->
        atom_name = String.to_atom("vite_server_#{ui_name}")
        if existing = Process.whereis(atom_name), do: cleanup_port(atom_name, existing)

        port =
          ${AppNameCamel}.OSAdapter.open_npm(["run", "dev", "--prefix", "apps/${AppNameSnake}_#{ui_name}/"])

        Process.register(port, atom_name)
        Process.link(port)
        Map.put(acc, ui_name, port)
      end)

    %{state | vite_servers: new_servers}
  end

  defp cleanup_port(atom_name, port) do
    kill(port)
    Process.unregister(atom_name)
  rescue
    ArgumentError -> :ok
  end

  defp start_timeout(state = %{existing_vite_pids: pids, vite_servers: servers}) do
    new_pids =
      servers
      |> Map.values()
      |> Enum.flat_map(fn port ->
        case Port.info(port) do
          nil -> []
          info -> [Keyword.get(info, :os_pid)]
        end
      end)
      |> Enum.filter(& &1)
      |> Enum.uniq()

    updated_pids = (pids ++ new_pids) |> Enum.uniq()
    orphaned_pids = ${AppNameCamel}.OSAdapter.orphan_pids(updated_pids)

    if orphaned_pids != [] do
      timeout = Task.async(fn -> ${AppNameCamel}.OSAdapter.kill_after(@timeout_sec + 0.15, orphaned_pids) end)
      %{state | timeout: timeout, existing_vite_pids: updated_pids}
    else
      %{state | existing_vite_pids: updated_pids}
    end
  end

  defp cancel_timeout(state = %{timeout: timeout}) do
    Task.shutdown(timeout)

    ${AppNameCamel}.OSAdapter.timer_pids() |> Enum.each(&kill/1)

    %{state | timeout: nil}
  end

  defp get_vite_processes, do: ${AppNameCamel}.OSAdapter.vite_pids()

  defp kill(nil), do: :ok

  defp kill(port) when is_port(port) do
    port |> Port.info() |> Keyword.get(:os_pid) |> kill()
  end

  defp kill(pid) when is_integer(pid) or is_binary(pid), do: ${AppNameCamel}.OSAdapter.kill_pid(pid)
  defp kill(pid) when is_pid(pid), do: Process.exit(pid, :kill)
  defp kill(_), do: :ok

  defp cleanup_all_vite_processes, do: ${AppNameCamel}.OSAdapter.stop_vite()

  # Start an external monitoring process using an inline script
  # This MUST be external to survive CTRL+C which kills the entire VM
  defp start_orphan_monitor do
    beam_pid = :os.getpid() |> List.to_string()
    os_type = :os.type()

    # Launch external monitor process
    spawn(fn ->
      ${AppNameCamel}.OSAdapter.watch_beam(beam_pid)
    end)

    IO.puts(
      "[ViteDevSupervisor] Started external orphan monitor (monitoring beam: #{beam_pid}, OS: #{inspect(os_type)})"
    )
  end
end
end
`;

  return generateFile(
    {
      dir: supervisorPath,
      filename: "vite_dev_supervisor.ex",
      content,
    },
    "gen_vite_supervisor"
  );
};

export { gen_vite_supervisor };
