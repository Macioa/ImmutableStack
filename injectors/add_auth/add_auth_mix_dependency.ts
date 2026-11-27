import { join } from "@/utils/path";
import { ApiAppData } from "@/generators/add_api";
import { readFileSync, writeFileSync } from "fs";
import { execute } from "@/runners";
import { format } from "@/utils/format";

// Browser tests drive passkeys through Chromium's virtual authenticator
const BROWSER_TEST_DEPS = `{:phoenix_test_playwright, "~> 0.19.0", only: :test, runtime: false},
      {:websockex, "~> 0.4", only: :test}`;

// Adds the web app's browser-test deps so the one deps.get below fetches them too
const add_web_test_deps = (webMix: string) => {
  const content = readFileSync(webMix, "utf8");
  if (content.includes(":phoenix_test_playwright")) return [];
  writeFileSync(webMix, content.replace(/(\{:bandit, "[^"]*"\})\n/, `$1,\n      ${BROWSER_TEST_DEPS}\n`), "utf8");
  return [webMix];
};

// Email: Swoosh plus Req (its API client) on the core app, which owns the Mailer
const EMAIL_DEPS = `{:swoosh, "~> 1.30"},
      {:req, "~> 0.7"},`;

const add_core_email_deps = (coreMix: string) => {
  const content = readFileSync(coreMix, "utf8");
  if (content.includes("{:swoosh")) return [];
  writeFileSync(coreMix, content.replace(/(defp deps do\s*\[\s*\n)/, `$1      ${EMAIL_DEPS}\n`), "utf8");
  return [coreMix];
};

const add_auth_mix_dependency = async ({
  LibDir,
  AppDir,
  WebDir,
  AppNameSnake,
  ApiNameSnake,
  UmbrellaDir,
}: ApiAppData) => {
  const apiAppName = `${AppNameSnake}_${ApiNameSnake}`;
  const file = join(AppDir || "", `${apiAppName}/mix.exs`);

  const corsPlugRegex = /{:cors_plug,\s*"[^"]*"},/;
  let content = readFileSync(file, "utf8");

  if (content.includes("{:pbkdf2_elixir")) {
    return [];
  }

  if (!corsPlugRegex.test(content)) {
    throw new Error("Failed to locate cors_plug dependency block while adding pbkdf2_elixir");
  }

  content = content.replace(
    corsPlugRegex,
    `{:pbkdf2_elixir, "~> 3.0"},\n      {:ithibati, "~> 0.11"},
      {:nimble_totp, "~> 1.0"},\n      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},\n      {:cors_plug, "~> 3.0"},`
  ).replace(
    /setup: \["deps.get"\],/,
    // Ithibati install state plus its integration rules
    `setup: ["deps.get"],\n      "ithibati.check": ["compile", "ithibati.doctor", "credo --checks Ithibati"],`
  );

  writeFileSync(file, content, "utf8");
  const webFiles = add_web_test_deps(join(WebDir || "", "mix.exs"));
  const coreFiles = add_core_email_deps(join(LibDir, "mix.exs"));

  await execute({ command: "mix deps.get", dir: UmbrellaDir }, "add_auth_mix_dependency");

  await format(file);

  return [file, ...webFiles, ...coreFiles];
};

export { add_auth_mix_dependency };

