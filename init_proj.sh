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

echo ""
echo "Generating Phoenix apps..." && sleep 2
mix phx.new $PROJECT_NAME --no-live --no-html --no-assets --binary-id --umbrella --install && \
# Modify mix.exs to add apps: [$PROJECT_NAME, "${PROJECT_NAME}_web"] underneath apps_path
sed -i '' "/apps_path: \"apps\"/a\\
  apps: [:${PROJECT_NAME}, :${PROJECT_NAME}_web],
" "${PROJECT_NAME}_umbrella/mix.exs"
cd "${PROJECT_NAME}_umbrella" && mix format mix.exs; cd ..

echo ""
echo "Generating React app..." && sleep 2
cd "${PROJECT_NAME}_umbrella/apps" && \
npx create-react-app "${PROJECT_NAME}_ui" --template typescript && \

echo ""
echo "Installing Redux..." && sleep 2
cd "${PROJECT_NAME}_ui" && \
npm install @reduxjs/toolkit react-redux @types/react-redux && \
npm install --save-dev @babel/plugin-proposal-private-property-in-object && \

cd ../../..