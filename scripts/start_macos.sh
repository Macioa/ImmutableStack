#!/bin/bash

# Check if Homebrew is installed
if command -v brew >/dev/null 2>&1; then
    echo "Homebrew is installed."
else
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if versions.sh is in the same directory and source it
if [ -f "$(dirname "$0")/versions.sh" ]; then
    echo "Sourcing versions.sh..."
    source "$(dirname "$0")/versions.sh"
else
    echo "versions.sh not found in the same directory."
    exit 1
fi

# Install the pinned mise ahead of any other mise on PATH
export PATH="$HOME/.local/bin:$HOME/.local/share/mise/shims:$PATH"
if mise --version 2>/dev/null | grep -qF "$MISE_VERSION"; then
    echo "mise $MISE_VERSION is installed."
else
    echo "Installing mise $MISE_VERSION..."
    curl -fsSL https://mise.run | MISE_VERSION="v$MISE_VERSION" MISE_INSTALL_PATH="$HOME/.local/bin/mise" sh
    mise --version | grep -qF "$MISE_VERSION" || { echo "mise $MISE_VERSION installation failed."; exit 1; }
fi

# Install each pinned tool unless that exact version is present (precompiled where available)
install_tool() {
    if mise where "$1@$2" >/dev/null 2>&1; then
        echo "$1 $2 is already installed."
    else
        echo "Installing $1 $2..."
        mise use --global "$1@$2"
    fi
}
install_tool erlang "$ERLANG_VERSION"
install_tool elixir "$ELIXIR_VERSION"
install_tool node "$NODE_VERSION"

# Install global npm packages
echo "Installing global npm packages..."
npm ci -g create-vite@9.3.4

# Install Hex and Phoenix
echo "Installing Hex and Phoenix..."
mix local.hex --force
mix archive.install hex phx_new $PHOENIX_VERSION --force

echo "Setup complete."