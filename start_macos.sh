#!/bin/bash

# Check if Homebrew is installed
if command -v brew >/dev/null 2>&1; then
    echo "Homebrew is installed."
else
    echo "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Check if asdf is installed
if brew list asdf >/dev/null 2>&1; then
    echo "asdf is installed."
else
    echo "Installing asdf..."
    brew install asdf
fi

# Add asdf to PATH and source its scripts
if [ -f "$HOME/.asdf/asdf.sh" ]; then
    . "$HOME/.asdf/asdf.sh"
    . "$HOME/.asdf/completions/asdf.bash"
else
    echo "asdf scripts not found. Please ensure asdf is installed correctly."
    exit 1
fi

# Validate that asdf is working
if ! command -v asdf >/dev/null 2>&1; then
    echo "asdf installation failed or is not in PATH."
    exit 1
fi

# Check if versions.sh is in the same directory and source it
if [ -f "$(dirname "$0")/versions.sh" ]; then
    echo "Sourcing versions.sh..."
    source "$(dirname "$0")/versions.sh"
else
    echo "versions.sh not found in the same directory."
    exit 1
fi

# Install Erlang using asdf
if asdf list erlang >/dev/null 2>&1; then
    echo "Erlang is already installed."
else
    echo "Installing Erlang..."
    asdf plugin-add erlang
    asdf install erlang $erlang
    asdf global erlang $erlang
fi

# Install Elixir using asdf
if asdf list elixir >/dev/null 2>&1; then
    echo "Elixir is already installed."
else
    echo "Installing Elixir..."
    asdf plugin-add elixir
    asdf install elixir $elixir
    asdf global elixir $elixir
fi

# Install Node.js using asdf
if asdf list nodejs >/dev/null 2>&1; then
    echo "Node.js is already installed."
else
    echo "Installing Node.js..."
    asdf plugin-add nodejs
    asdf install nodejs $nodejs
    asdf global nodejs $nodejs
fi

# Install global npm packages
echo "Installing global npm packages..."
npm install -g create-react-app typescript
# npm install -g redux react-redux @types/react-redux

# Install Hex and Phoenix
echo "Installing Hex and Phoenix..."
mix local.hex --force
mix archive.install hex phx_new --force

echo "Setup complete."