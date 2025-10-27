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
          {:spawn_executable, System.find_executable("npm")}
          |> Port.open([
            :binary,
            {:args, ["run", "dev", "--prefix", "apps/${AppNameSnake}_#{ui_name}/"]},
            :stderr_to_stdout
          ])

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
    orphaned_pids = get_vite_processes() |> Enum.reject(&(&1 in updated_pids))

    if orphaned_pids != [] do
      cmd = "sleep #{@timeout_sec + 0.15} ; kill -9 #{Enum.join(orphaned_pids, " ")} #ViteTimeout"
      timeout = Task.async(fn -> {_, 0} = System.cmd("bash", ["-c", cmd]) end)
      %{state | timeout: timeout, existing_vite_pids: updated_pids}
    else
      %{state | existing_vite_pids: updated_pids}
    end
  end

  defp cancel_timeout(state = %{timeout: timeout}) do
    Task.shutdown(timeout)

    case System.cmd("bash", [
           "-c",
           "ps aux | grep 'ViteTimeout' | grep -v grep | awk '{print $2}'"
         ]) do
      {timeout_pids, 0} ->
        timeout_pids
        |> String.split("\n")
        |> Enum.filter(fn s -> s not in ["", nil] end)
        |> Enum.each(&kill/1)

      _ ->
        :ok
    end

    %{state | timeout: nil}
  end

  defp get_vite_processes do
    case System.cmd("pgrep", ["-af", "vite"]) do
      {output, 0} ->
        output
        |> String.split("\n")
        |> Enum.map(fn line ->
          case Regex.run(~r/^(\\d+)/, String.trim(line)) do
            [_, pid] -> String.to_integer(pid)
            _ -> nil
          end
        end)
        |> Enum.filter(& &1)

      _ ->
        []
    end
  end

  defp kill(nil), do: :ok

  defp kill(port) when is_port(port) do
    port |> Port.info() |> Keyword.get(:os_pid) |> kill()
  end

  defp kill(pid) when is_integer(pid),
    do: System.cmd("kill", ["-9", to_string(pid)], stderr_to_stdout: true)

  defp kill(pid) when is_binary(pid), do: System.cmd("kill", ["-9", pid], stderr_to_stdout: true)
  defp kill(pid) when is_pid(pid), do: Process.exit(pid, :kill)
  defp kill(_), do: :ok

  defp cleanup_all_vite_processes do
    for pattern <- ["npm.*run dev", "vite", "node.*vite"],
        do: System.cmd("pkill", ["-9", "-f", pattern], stderr_to_stdout: true)
  end

  # Start an external monitoring process using an inline script
  # This MUST be external to survive CTRL+C which kills the entire VM
  defp start_orphan_monitor do
    beam_pid = :os.getpid() |> List.to_string()
    os_type = :os.type()

    # Launch external monitor process
    spawn(fn ->
      start_monitor_by_os(os_type, beam_pid)
    end)

    IO.puts(
      "[ViteDevSupervisor] Started external orphan monitor (monitoring beam: #{beam_pid}, OS: #{inspect(os_type)})"
    )
  end

  defp start_monitor_by_os({:win32, _}, beam_pid) do
    # Windows PowerShell script
    cmd = """
    while ($true) {
      try {
        $proc = Get-Process -Id #{beam_pid} -ErrorAction Stop
        Start-Sleep -Seconds 2
      } catch {
        # Process dead, kill vite processes
        Get-Process | Where-Object { $_.ProcessName -like '*vite*' -or $_.CommandLine -like '*vite*' } | Stop-Process -Force
        Get-Process | Where-Object { $_.ProcessName -like '*npm*' } | Where-Object { $_.CommandLine -like '*run dev*' } | Stop-Process -Force
        Write-Host "[ViteOrphanMonitor] Cleanup complete"
        exit 0
      }
    }
    """

    System.cmd("powershell", ["-NoProfile", "-Command", cmd], [{:stderr_to_stdout, true}])
  end

  defp start_monitor_by_os(_, beam_pid) do
    # Unix/Linux/macOS bash script
    cmd = """
    while kill -0 #{beam_pid} 2>/dev/null; do
      sleep 2
    done
    pkill -9 -f "npm.*run dev" 2>/dev/null
    pkill -9 -f "vite" 2>/dev/null
    pkill -9 -f "node.*vite" 2>/dev/null
    echo "[ViteOrphanMonitor] Cleanup complete"
    """

    System.cmd("bash", ["-c", cmd], [{:stderr_to_stdout, true}])
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
