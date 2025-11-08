import { AppData } from "../../readers/get_app_data";
import { generateFile } from "../index";
import { join } from "../../utils/path";

const gen_docker_ui_prod = async ({ UmbrellaDir, AppNameSnake }: AppData, uiName: string = 'ui') => {
  let dir = UmbrellaDir || "";
  dir = join(dir, "docker/prod");
  const filename = `${AppNameSnake}_${uiName}.dockerfile`;
  const content = `# Stage 1: Build React/TypeScript UI
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY apps/package.json apps/package-lock.json ./
COPY apps/${AppNameSnake}_${uiName}/package.json ./${AppNameSnake}_${uiName}/

# Install dependencies
RUN npm ci

# Copy the entire apps directory for building
COPY apps/${AppNameSnake} ./${AppNameSnake}
COPY apps/${AppNameSnake}_${uiName} ./${AppNameSnake}_${uiName}

# Build UI with custom outDir to dist (override vite config's outDir)
RUN cd ${AppNameSnake}_${uiName} && npx vite build --outDir dist

# Stage 2: Nginx to serve static files
FROM nginx:alpine

# Copy built static files from builder
COPY --from=builder /app/${AppNameSnake}_${uiName}/dist /usr/share/nginx/html

# Configure nginx to serve the app with /ui/ base path
RUN echo 'server { \\
    listen 80; \\
    server_name localhost; \\
    root /usr/share/nginx/html; \\
    index index.html; \\
    location /${uiName}/ { \\
        alias /usr/share/nginx/html/; \\
        try_files $uri $uri/ /index.html; \\
    } \\
    location / { \\
        return 301 /${uiName}/; \\
    } \\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`;

  return generateFile({ filename, dir, content }, "gen_docker_ui_prod");
};

export { gen_docker_ui_prod };


