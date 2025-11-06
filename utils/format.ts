import { execSync } from "child_process";

const format = async (file: string) => {
  return new Promise((resolve, reject) => {
    const isReact = file.endsWith(".tsx") || file.endsWith(".ts");
    const isElixir = file.endsWith(".ex") || file.endsWith(".exs");
    
    try {
      if (isReact) execSync(`npx prettier --write ${file}`, { stdio: "ignore" });
      if (isElixir) execSync(`mix format ${file}`, { stdio: "ignore" });
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
