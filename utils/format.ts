/*
** Format **
    Formats generated Elixir (mix format) and TypeScript (oxfmt, Prettier compatible)
      - per file by default, since injectors match against formatted code
      - deferred mode (init) queues files and formats them in one pass with flushFormat;
        injectors that need formatted input pass formatFirst to inject_file
*/
import { exec, execFileSync } from "child_process";
import { existsSync } from "fs";
import { basename, dirname, join, resolve as resolvePath } from "path";
import { promisify } from "util";
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

const run = promisify(exec);

// cmd.exe rejects command lines over 8191 characters, so long file lists run in batches
const MAX_ARGS_LENGTH = 6000;

const batchByLength = (files: string[]) =>
  files.reduce<string[][]>((batches, file) => {
    const last = batches[batches.length - 1];
    const fits = last && quote([...last, file]).length <= MAX_ARGS_LENGTH;
    return fits ? [...batches.slice(0, -1), [...last, file]] : [...batches, [file]];
  }, []);

const runBatches = (command: string, files: string[], options: { cwd?: string } = {}) =>
  batchByLength(files).reduce<Promise<unknown>>(
    (previous, batch) => previous.then(() => run(`${command} ${quote(batch)}`, options)),
    Promise.resolve()
  );

const formatElixirFiles = async (files: string[], nomix: boolean) =>
  nomix ? files.forEach(formatElixirInDocker) : runBatches("mix format", files);

// The project's own oxfmt, found by searching up from the file, skips npx resolution
const localOxfmt = (dir: string): string | null => {
  const bin = join(dir, "node_modules", ".bin", process.platform === "win32" ? "oxfmt.cmd" : "oxfmt");
  if (existsSync(bin)) return bin;
  const parent = dirname(dir);
  return parent === dir ? null : localOxfmt(parent);
};

// oxfmt finds apps/.oxfmtrc.json by searching up from cwd
const formatTypescriptFiles = (files: string[]) => {
  const cwd = dirname(files[0]);
  const bin = localOxfmt(cwd);
  return runBatches(bin ? `"${bin}"` : `npx --yes --prefer-offline ${OXFMT}`, files, { cwd });
};

// Missing deps during generation is fine, the file is formatted later
const isMissingDependency = (error: unknown) =>
  error instanceof Error && error.message.includes("Unknown dependency");

const skipMissingDependency = (error: unknown) => {
  if (!isMissingDependency(error)) throw error;
  console.log(`Skipping format - dependencies not yet installed`);
};

// Elixir and TypeScript format in parallel
const formatNow = async (files: string[]) => {
  const nomix = (await getSetting("nomix")) == "true";
  const elixir = files.filter(isElixir);
  const typescript = files.filter(isTypescript);
  files.forEach((file) => pending.delete(file));
  await Promise.all([
    typescript.length ? formatTypescriptFiles(typescript) : null,
    elixir.length ? formatElixirFiles(elixir, nomix) : null,
  ]).catch(skipMissingDependency);
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
