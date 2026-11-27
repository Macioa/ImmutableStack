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

# Install the pinned asdf release binary ahead of any other asdf on PATH
export ASDF_DATA_DIR="$HOME/.asdf"
export PATH="$ASDF_DATA_DIR/bin:$ASDF_DATA_DIR/shims:$PATH"
if asdf --version 2>/dev/null | grep -qF "$ASDF_VERSION"; then
    echo "asdf $ASDF_VERSION is installed."
else
    echo "Installing asdf $ASDF_VERSION..."
    os=$(uname -s | tr A-Z a-z)
    arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')
    mkdir -p "$ASDF_DATA_DIR/bin"
    curl -fsSL "https://github.com/asdf-vm/asdf/releases/download/v$ASDF_VERSION/asdf-v$ASDF_VERSION-$os-$arch.tar.gz" | tar -xz -C "$ASDF_DATA_DIR/bin" asdf
    asdf --version | grep -qF "$ASDF_VERSION" || { echo "asdf $ASDF_VERSION installation failed."; exit 1; }
fi

# Install each pinned tool unless that exact version is present
install_tool() {
    if asdf where "$1" "$2" >/dev/null 2>&1; then
        echo "$1 $2 is already installed."
    else
        echo "Installing $1 $2..."
        asdf plugin list | grep -qx "$1" || asdf plugin add "$1"
        asdf install "$1" "$2"
        asdf set -u "$1" "$2"
    fi
}
install_tool erlang "$ERLANG_VERSION"
install_tool elixir "$ELIXIR_VERSION"
install_tool nodejs "$NODE_VERSION"

# Install global npm packages
echo "Installing global npm packages..."
npm ci -g create-vite@9.3.4

# Install Hex and Phoenix
echo "Installing Hex and Phoenix..."
mix local.hex --force
mix archive.install hex phx_new $PHOENIX_VERSION --force

echo "Setup complete."