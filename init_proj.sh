#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <project_name>"
  exit 1
fi

# Convert project name to lowercase
PROJECT_NAME=$(echo "$1" | tr '[:upper:]' '[:lower:]')

# Replace spaces and dashes with underscores
PROJECT_NAME=$(echo "$PROJECT_NAME" | tr ' -' '_')

# Remove all other special characters
PROJECT_NAME=$(echo "$PROJECT_NAME" | sed 's/[^a-z0-9_]//g')

# Initialize new project
mix phx.new $PROJECT_NAME --no-html --no-assets --binary-id --umbrella --install && \
cd "${PROJECT_NAME}_umbrella/apps" && \
npx create-react-app "${PROJECT_NAME}_ui" --template typescript && \
cd "${PROJECT_NAME}_ui" && \
npm install @reduxjs/toolkit react-redux @types/react-redux && \
npm install --save-dev @babel/plugin-proposal-private-property-in-object && \
cd ../..