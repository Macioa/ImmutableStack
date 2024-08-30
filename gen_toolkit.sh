#!/bin/bash

if [ -f "$(dirname "$0")/versions.sh" ]; then
    echo "Sourcing versions.sh..."
    source "versions.sh"
else
    echo "versions.sh not found in the same directory."
    exit 1
fi

# Get the path argument or use the current directory if not provided
TARGET_DIR=${1:-$(pwd)}

# Create the .tool-versions file in the specified directory
echo "nodejs ${NODE_VERSION}
erlang ${ERLANG_VERSION}
elixir ${ELIXIR_VERSION}" > "${TARGET_DIR}/.tool-versions"

echo "Generated .tool-versions file at ${TARGET_DIR}/.tool-versions"