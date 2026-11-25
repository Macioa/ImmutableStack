import { execFileSync, execSync } from "child_process";
import { basename, dirname, resolve as resolvePath } from "path";
import { getSetting } from "./settings";

const FORMAT_IMAGE = "elixir:1.20-alpine";
const FORMAT_SCRIPT = 'f = hd(System.argv()); File.write!(f, [Code.format_file!(f), "\\n"])';

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

const formatElixir = (file: string, nomix: boolean) =>
  nomix ? formatElixirInDocker(file) : execSync(`mix format ${file}`, { stdio: "ignore" });

const format = async (file: string) => {
  const nomix = (await getSetting("nomix")) == "true";
  return new Promise((resolve, reject) => {
    const isReact = file.endsWith(".tsx") || file.endsWith(".ts");
    const isElixir = file.endsWith(".ex") || file.endsWith(".exs");

    try {
      if (isReact) execSync(`npx prettier --write ${file}`, { stdio: "ignore" });
      if (isElixir) formatElixir(file, nomix);
    } catch (error) {
      // If mix format fails due to missing dependencies, that's OK -
      // the file will be formatted later when deps are installed
      if (isElixir && error && typeof error === 'object' && 'message' in error &&
          typeof error.message === 'string' && error.message.includes('Unknown dependency')) {
        console.log(`Skipping format for ${file} - dependencies not yet installed`);
        resolve(true);
        return;
      }
      throw error;
    }
    resolve(true);
  });
};

export { format };
