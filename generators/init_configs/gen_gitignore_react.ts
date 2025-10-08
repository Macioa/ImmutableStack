import path from "path";
import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_gitignore_react = async ({ AppNameSnake, AppDir }: AppData, uiName: string = 'temp_ui') => {
  const dir = path.join(AppDir, `${AppNameSnake}_${uiName}`);
  const filename = ".gitignore";
  const content = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Testing
coverage/
.nyc_output

# Build outputs
build/
out/

# Cache directories
.cache/
.parcel-cache/

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/`;

  return generateFile({ filename, dir, content }, "gen_gitignore_react");
};

export { gen_gitignore_react };
