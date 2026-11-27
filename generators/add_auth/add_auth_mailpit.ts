import { join } from "@/utils/path";
import { generateFile } from "@/generators/index";
import { ApiAppData } from "@/generators/add_api";

// Pinned Mailpit release: assets are mailpit-<windows|darwin|linux>-<amd64|arm64>.<zip|tar.gz>
const MAILPIT_VERSION = "1.34.0";
const MAILPIT_UI_PORT = 8025;
const MAILPIT_SMTP_PORT = 1025;

// Dev only: the web endpoint's watcher downloads Mailpit for this OS once, then runs it.
// MIX_ENV=prod, docker and test never compile this module.
const mailpitModule = ({ AppNameCamel }: ApiAppData) => `if Mix.env() == :dev do
  defmodule ${AppNameCamel}.Mailpit do
    @moduledoc """
    Local email inbox for dev. The web endpoint runs \`install_and_run/0\` as a watcher:
    it downloads Mailpit ${MAILPIT_VERSION} for this OS into _build/mailpit once, then runs it.
    Inbox: http://localhost:${MAILPIT_UI_PORT}. Never installed or started outside dev.
    """
    require Logger

    alias ${AppNameCamel}.OSAdapter

    @version "${MAILPIT_VERSION}"
    @ui_port ${MAILPIT_UI_PORT}
    @smtp_port ${MAILPIT_SMTP_PORT}
    # Umbrella root, like OSAdapter
    @root Path.expand("../../../../..", __DIR__)

    def install_and_run do
      if running?(),
        do: Logger.info("[Mailpit] already running, inbox at http://localhost:#{@ui_port}"),
        else: install() |> run()
    end

    @doc "Downloads the binary for this OS unless it is already there. Returns its path."
    def install do
      unless File.exists?(bin_path()), do: download()
      bin_path()
    end

    # Mailpit stops with the server: OSAdapter kills it once this VM exits
    defp run(bin) do
      Logger.info("[Mailpit] inbox at http://localhost:#{@ui_port}")
      args = ["--listen", "127.0.0.1:#{@ui_port}", "--smtp", "127.0.0.1:#{@smtp_port}"]
      port = Port.open({:spawn_executable, bin}, [:binary, :exit_status, :stderr_to_stdout, args: args])
      {:os_pid, os_pid} = Port.info(port, :os_pid)
      OSAdapter.kill_with_beam(os_pid)
      stream(port)
    end

    defp stream(port) do
      receive do
        {^port, {:data, data}} ->
          IO.write(data)
          stream(port)

        {^port, {:exit_status, status}} ->
          Logger.info("[Mailpit] exited with status #{status}")
      end
    end

    # A Mailpit left over from an earlier run (or started by hand) is reused
    defp running? do
      case :gen_tcp.connect(~c"127.0.0.1", @ui_port, [], 500) do
        {:ok, socket} -> :gen_tcp.close(socket)
        _ -> false
      end
    end

    defp dir, do: Path.join([@root, "_build", "mailpit", @version])
    defp bin_path, do: Path.join(dir(), if(OSAdapter.family() == :win32, do: "mailpit.exe", else: "mailpit"))
    defp archive, do: if(OSAdapter.os_name() == :windows, do: "zip", else: "tar.gz")
    defp asset, do: "mailpit-#{OSAdapter.os_name()}-#{OSAdapter.arch()}.#{archive()}"
    defp url, do: "https://github.com/axllent/mailpit/releases/download/v#{@version}/#{asset()}"

    defp download do
      Logger.info("[Mailpit] downloading #{url()}")
      Enum.each([:inets, :ssl], &Application.ensure_all_started/1)
      {:ok, {{_, 200, _}, _headers, body}} = :httpc.request(:get, {String.to_charlist(url()), []}, [ssl: ssl()], body_format: :binary)
      File.mkdir_p!(dir())
      extract(archive(), body, String.to_charlist(dir()))
      move_binary_to_root()
      File.chmod!(bin_path(), 0o755)
    end

    defp extract("zip", body, cwd), do: {:ok, _files} = :zip.extract(body, cwd: cwd)
    defp extract(_tar_gz, body, cwd), do: :ok = :erl_tar.extract({:binary, body}, [:compressed, cwd: cwd])

    # In case an archive keeps the binary in a subfolder
    defp move_binary_to_root do
      name = Path.basename(bin_path())

      unless File.exists?(bin_path()),
        do: dir() |> Path.join("**/#{name}") |> Path.wildcard() |> List.first() |> File.rename!(bin_path())
    end

    defp ssl do
      [
        verify: :verify_peer,
        cacerts: :public_key.cacerts_get(),
        customize_hostname_check: [match_fun: :public_key.pkix_verify_hostname_match_fun(:https)]
      ]
    end
  end
end
`;

const add_auth_mailpit = async (apiAppData: ApiAppData) =>
  generateFile(
    { dir: join(apiAppData.LibDir, "lib/mix/processes"), filename: "mailpit.ex", content: mailpitModule(apiAppData) },
    "add_auth_mailpit"
  );

// Docker env: Mailpit runs as its own compose service instead
const mailpitDockerfile = `# Local email inbox for the docker env (never used in prod).
# Web UI and send API on 8025, SMTP on 1025.
FROM axllent/mailpit:v${MAILPIT_VERSION}
`;

const add_auth_mailpit_dockerfile = async ({ UmbrellaDir }: ApiAppData) =>
  generateFile({ dir: join(UmbrellaDir, "docker"), filename: "mailpit.dockerfile", content: mailpitDockerfile }, "add_auth_mailpit");

export { add_auth_mailpit, add_auth_mailpit_dockerfile, MAILPIT_UI_PORT };
