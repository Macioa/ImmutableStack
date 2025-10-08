import { join } from "../../utils/path";
import { generateFile } from "..";
import { ApiAppData } from "./gen_api_endpoint";

const gen_api_mix_exs = async ({ AppDir, AppNameSnake, ApiNameSnake, ApiNameCamel }: ApiAppData) => {
  const filename = "mix.exs";
  const apiAppName = `${ApiNameSnake}_web`;
  const dir = join(AppDir || "", `${apiAppName}`);
  const content = `defmodule ${ApiNameCamel}.MixProject do
  use Mix.Project

  def project do
    [
      compilers: Mix.compilers() ++ [:custom_compiler],
      app: :${apiAppName},
      version: "0.1.0",
      build_path: "../../_build",
      config_path: "../../config/config.exs",
      deps_path: "../../deps",
      lockfile: "../../mix.lock",
      elixir: "~> 1.14",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {${ApiNameCamel}.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:cors_plug, "~> 2.0"},
      {:phoenix, "~> 1.7.14"},
      {:phoenix_ecto, "~> 4.5"},
      {:phoenix_live_dashboard, "~> 0.8.3"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.0"},
      {:gettext, "~> 0.20"},
      {:${AppNameSnake}, in_umbrella: true},
      {:jason, "~> 1.2"},
      {:bandit, "~> 1.5"}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end`;

  return generateFile({ filename, dir, content }, "gen_api_mix_exs");
};

export { gen_api_mix_exs };

