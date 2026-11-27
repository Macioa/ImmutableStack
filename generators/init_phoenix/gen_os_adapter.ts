import { join } from "../../utils/path";
import { generateFile } from "../index";
import { AppData } from "../../readers/get_app_data";

const gen_os_adapter = async ({ AppNameCamel, LibDir }: AppData) => {
  const dir = join(LibDir, `/lib/mix/processes/`);

  const content = `
if Mix.env() == :dev do
defmodule ${AppNameCamel}.OSAdapter do
  @moduledoc "Simple OS commands with Windows and Unix versions."

  # Umbrella root, since the VM's working directory can change during compile
  @root Path.expand("../../../../..", __DIR__)

  defp family, do: :os.type() |> elem(0)

  def open_npm(args) do
    {exe, exe_args} =
      case family() do
        :win32 -> {System.find_executable("cmd"), ["/c", "npm" | args]}
        _ -> {System.find_executable("npm"), args}
      end

    Port.open({:spawn_executable, exe}, [:binary, :hide, {:cd, @root}, {:args, exe_args}, :stderr_to_stdout])
  end

  def vite_pids do
    {output, status} =
      case family() do
        :win32 -> powershell("#{vite_query()} | ForEach-Object { $_.ProcessId }")
        _ -> System.cmd("pgrep", ["-af", "vite"])
      end

    if status == 0, do: parse_pids(output), else: []
  end

  def kill_pid(pid) do
    case family() do
      :win32 -> System.cmd("taskkill", ["/F", "/T", "/PID", to_string(pid)], stderr_to_stdout: true)
      _ -> System.cmd("kill", ["-9", to_string(pid)], stderr_to_stdout: true)
    end
  end

  # Windows has none: its slower process query can see the Vite that just started
  def orphan_pids(known_pids) do
    case family() do
      :win32 -> []
      _ -> Enum.reject(vite_pids(), &(&1 in known_pids))
    end
  end

  def kill_after(seconds, pids) do
    cmd = "sleep #{seconds} ; kill -9 #{Enum.join(pids, " ")} #ViteTimeout"
    {_, 0} = System.cmd("bash", ["-c", cmd])
  end

  def timer_pids do
    case family() do
      :win32 -> []
      _ -> unix_timer_pids()
    end
  end

  defp unix_timer_pids do
    case System.cmd("bash", ["-c", "ps aux | grep 'ViteTimeout' | grep -v grep | awk '{print $2}'"]) do
      {output, 0} -> output |> String.split("\\n") |> Enum.reject(&(&1 == ""))
      _ -> []
    end
  end

  # Windows stops only this project's Vite processes
  def stop_vite do
    case family() do
      :win32 -> powershell(stop_vite_script())
      _ -> Enum.each(["npm.*run dev", "vite", "node.*vite"], &pkill/1)
    end
  end

  defp pkill(pattern), do: System.cmd("pkill", ["-9", "-f", pattern], stderr_to_stdout: true)

  # Runs outside the VM so cleanup still happens after CTRL+C
  def watch_beam(beam_pid) do
    case family() do
      :win32 -> watch_beam_windows(beam_pid)
      _ -> watch_beam_unix(beam_pid)
    end
  end

  defp watch_beam_windows(beam_pid) do
    script = """
    $ProgressPreference = 'SilentlyContinue'
    while (Get-Process -Id #{beam_pid} -ErrorAction SilentlyContinue) { Start-Sleep -Seconds 2 }
    #{stop_vite_script()}
    """

    powershell(
      "Start-Process powershell -WindowStyle Hidden -ArgumentList '-NoProfile','-NonInteractive','-EncodedCommand','#{encode(script)}'"
    )
  end

  # Bracketed patterns stop Linux pkill from matching this script itself
  defp watch_beam_unix(beam_pid) do
    cmd = """
    while kill -0 #{beam_pid} 2>/dev/null; do
      sleep 2
    done
    pkill -9 -f "[n]pm.*run dev" 2>/dev/null
    pkill -9 -f "[v]ite" 2>/dev/null
    pkill -9 -f "[n]ode.*vite" 2>/dev/null
    echo "[ViteOrphanMonitor] Cleanup complete"
    """

    System.cmd("bash", ["-c", cmd], [{:stderr_to_stdout, true}])
  end

  defp parse_pids(output) do
    output
    |> String.split("\\n")
    |> Enum.flat_map(fn line ->
      case Regex.run(~r/^(\\d+)/, String.trim(line)) do
        [_, pid] -> [String.to_integer(pid)]
        _ -> []
      end
    end)
  end

  defp stop_vite_script do
    "#{vite_query()} | ForEach-Object { taskkill /F /T /PID $_.ProcessId 2>$null | Out-Null }"
  end

  defp vite_query do
    apps = @root |> Path.join("apps") |> String.replace("\\\\", "/") |> String.downcase()

    """
    Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object {
      $c = ([string]$_.CommandLine).Replace('\\\\', '/').ToLower()
      $c.Contains('#{apps}/') -and $c.Contains('vite')
    }
    """
    |> String.trim()
  end

  defp powershell(script) do
    System.cmd(
      "powershell",
      ["-NoProfile", "-NonInteractive", "-EncodedCommand", encode(script)],
      stderr_to_stdout: true
    )
  end

  defp encode(script) do
    script |> :unicode.characters_to_binary(:utf8, {:utf16, :little}) |> Base.encode64()
  end
end
end
`;

  return generateFile(
    { dir, filename: "os_adapter.ex", content },
    "gen_os_adapter"
  );
};

export { gen_os_adapter };
