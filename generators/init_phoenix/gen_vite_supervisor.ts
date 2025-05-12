import { join } from "path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_vite_supervisor = async ({
  AppNameSnake,
  AppNameCamel,
  LibDir,
}: AppData) => {
  const supervisorPath = join(LibDir, `/lib/mix/processes/`);

  const content = `
defmodule ${AppNameCamel}.ViteDevSupervisor do
  use GenServer

  @vite_dev_cmd ["run", "dev", "--prefix", "apps/${AppNameSnake}_ui/"]
  @timeout_sec 5
  @type state :: %{
          vite_server: nil | Port.t(),
          existing_vite_pids: [Integer.t()],
          timeout: nil | PID.t()
        }
  @init_state %{vite_server: nil, existing_vite_pids: [], timeout: nil}

  def init_state(map) when is_map(map), do: Map.merge(@init_state, map)

  def start_link(_), do: GenServer.start(__MODULE__, nil, name: __MODULE__)

  @impl true
  def init(_) do
    existing_vite_pids = get_vite_processes()
    Process.flag(:trap_exit, true)
    Process.link(self())

    Process.whereis(:vite_server) |> kill

    state =
      %{existing_vite_pids: existing_vite_pids}
      |> init_state()
      |> restart_timeout()

    Process.send_after(self(), :restart, @timeout_sec * 1000)
    {:ok, state}
  end

  @impl true
  # Polling mechanism
  def handle_info(:restart, state) do
    Process.send_after(self(), :restart, @timeout_sec * 1000)
    {:noreply, restart_timeout(state)}
  end

  @impl true
  # Forward Vite console output
  def handle_info({_port, {:data, msg}}, state) do
    IO.puts(msg)
    {:noreply, state}
  end

  @impl true
  # Ignore Process exit
  def handle_info({:EXIT, _port, :normal}, state), do: {:noreply, state}

  @impl true
  # Catch all unhandled info, print, and force error
  def handle_info(msg, state) do
    IO.inspect({msg, state}, label: :error_unhandled_info)
    {:error, :unhandled_info}
  end

  defp restart_timeout(state = %{vite_server: port, timeout: timeout}) do
    case [port, timeout] do
      [nil, nil] ->
        state
        |> start_dev_server()
        |> start_timeout()

      [nil, _] ->
        state
        |> cancel_timeout()
        |> start_dev_server()
        |> start_timeout()

      [_, nil] ->
        state
        |> start_timeout()

      [_, _] ->
        state
        |> cancel_timeout()
        |> start_timeout()
    end
  end

  defp start_dev_server(state) do
    port =
      {:spawn_executable, System.find_executable("npm")}
      |> Port.open([:binary, args: @vite_dev_cmd])

    Process.register(port, :vite_server)
    Process.link(port)

    %{state | vite_server: port}
  end

  defp start_timeout(state = %{existing_vite_pids: pids}) do
    spawned_vite_pids =
      get_vite_processes()
      |> Enum.filter(fn pid -> pid not in pids end)

    kill_cmd = fn pid -> "kill -9 #{pid}" end
    kill_vite_pids = spawned_vite_pids |> Enum.map(&kill_cmd.(&1)) |> Enum.join(" & ")

    full_cmd =
      "sleep #{@timeout_sec + 0.15} ; #{kill_vite_pids} #ViteTimeout"

    %{state | timeout: Task.async(fn -> {_, 0} = System.cmd("bash", ["-c", full_cmd]) end)}
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
        |> Enum.map(&String.trim/1)
        |> Enum.filter(fn string -> string != "" end)

      _ ->
        []
    end
  end

  defp get_pid(nil), do: {:error, :cannot_be_nil}
  defp get_pid(port) when is_port(port), do: Port.info(port)[:os_pid]
  defp get_pid(key) when is_atom(key), do: Process.whereis(key)

  defp kill(nil), do: {:error, :cannot_be_nil}
  defp kill(pid) when is_integer(pid) or is_binary(pid), do: System.cmd("kill", ["-9", pid])
  defp kill(port) when is_port(port), do: port |> get_pid |> kill
  defp kill(pid) when is_pid(pid), do: Process.exit(pid, :kill)
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
