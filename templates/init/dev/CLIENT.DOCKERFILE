# Use a Node 16 base image with Alpine Linux
FROM node:16-alpine

# Set the working directory to /app
WORKDIR /app

# Copy app files, excluding node_modules
COPY . .

# Install dependencies (npm ci makes sure the exact versions in the lockfile get installed)
RUN npm ci

# Build the app
RUN npm run build

# Set environment variables
ENV NODE_ENV production

# Expose the port on which the app will be running (default 3000)
EXPOSE 3000

# Start the app using npx serve
CMD ["npx", "serve", "build"]