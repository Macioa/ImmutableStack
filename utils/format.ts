/*
** Format **
    Formats generated Elixir (mix format) and TypeScript (oxfmt, Prettier compatible)
      - per file by default, since injectors match against formatted code
      - deferred mode (init) queues files and formats them in one pass with flushFormat;
        injectors that need formatted input pass formatFirst to inject_file
*/
import { execFileSync, execSync } from "child_process";
import { basename, dirname, resolve as resolvePath } from "path";
import { getSetting } from "./settings";

const FORMAT_IMAGE = "elixir:1.20-alpine";
const FORMAT_SCRIPT = 'f = hd(System.argv()); File.write!(f, [Code.format_file!(f), "\\n"])';
const OXFMT = "oxfmt@0.80.0";

// Queued files while deferred, mirrors the in-memory history_cache log
const pending = new Set<string>();
var deferred = false;

const isTypescript = (file: string) => file.endsWith(".tsx") || file.endsWith(".ts");
const isElixir = (file: string) => file.endsWith(".ex") || file.endsWith(".exs");

// Injectors expect formatted Elixir, so nomix formats each file without host Elixir
const formatElixirInDocker = (file: string) =>
  execFileSync(
    "docker",
    [
      "run", "--rm",
      "-v", `${dirname(resolvePath(file))}:/format`,
      "-w", "/format",
      FORMAT_IMAGE,
      "elixir", "-e", FORMAT_SCRIPT, "--", basename(file),
    ],
    { stdio: "ignore" }
  );

const quote = (files: string[]) => files.map((f) => `"${f}"`).join(" ");

const formatElixirFiles = (files: string[], nomix: boolean) =>
  nomix ? files.forEach(formatElixirInDocker) : execSync(`mix format ${quote(files)}`, { stdio: "ignore" });

// oxfmt finds apps/.oxfmtrc.json by searching up from cwd
const formatTypescriptFiles = (files: string[]) =>
  execSync(`npx --yes --prefer-offline ${OXFMT} ${quote(files)}`, { stdio: "pipe", cwd: dirname(files[0]) });

// Missing deps during generation is fine, the file is formatted later
const isMissingDependency = (error: unknown) =>
  error instanceof Error && error.message.includes("Unknown dependency");

const formatNow = async (files: string[]) => {
  const nomix = (await getSetting("nomix")) == "true";
  const elixir = files.filter(isElixir);
  const typescript = files.filter(isTypescript);
  files.forEach((file) => pending.delete(file));
  try {
    if (typescript.length) formatTypescriptFiles(typescript);
    if (elixir.length) formatElixirFiles(elixir, nomix);
  } catch (error) {
    if (!isMissingDependency(error)) throw error;
    console.log(`Skipping format - dependencies not yet installed`);
  }
  return true;
};

// force: format now even when deferred, for injectors that need formatted input
const format = async (file: string, { force = false }: { force?: boolean } = {}) => {
  if (deferred && !force) return pending.add(file) && true;
  return formatNow([file]);
};

const setDeferredFormat = (defer: boolean) => {
  deferred = defer;
  return deferred;
};

const isPendingFormat = (file: string) => pending.has(file);

const flushFormat = async () => formatNow([...pending]);

export { format, setDeferredFormat, flushFormat, isPendingFormat };
