import { execSync } from "child_process";

const format = async (file: string) => {
  return new Promise((resolve, reject) => {
    const isReact = file.endsWith(".tsx") || file.endsWith(".ts");
    const isElixir = file.endsWith(".ex") || file.endsWith(".exs");
    if (isReact) execSync(`npx prettier --write ${file}`, { stdio: "inherit" });
    if (isElixir) execSync(`mix format ${file}`, { stdio: "inherit" });
    resolve(true);
  });
};

export { format };
