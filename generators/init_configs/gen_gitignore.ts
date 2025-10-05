import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";

const gen_gitignore = async ({ UmbrellaDir }: AppData) => {
  let dir = UmbrellaDir || "";
  const filename = ".gitignore";
  const content = `# Phoenix/Elixir
/_build/
/cover/
/deps/
/doc/
/.fetch
erl_crash.dump
*.ez
/tmp/

# Node.js/React (for UI apps)
node_modules/
dist/
dist-ssr/
*.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea/
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Docker
docker/pgdata/
*.tar

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.sqlite
*.sqlite3

# OS generated files
Thumbs.db
ehthumbs.db
Desktop.ini

# Package manager files
package-lock.json
yarn.lock
pnpm-lock.yaml`;

  return generateFile({ filename, dir, content }, "gen_gitignore");
};

export { gen_gitignore };
