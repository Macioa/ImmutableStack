#!/bin/bash

# Sync Versions Script
# Extracts version from package.json and updates the zip command

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Look for package.json in the parent directory (project root)
PACKAGE_JSON="$SCRIPT_DIR/../package.json"

# Check if package.json exists
if [ ! -f "$PACKAGE_JSON" ]; then
    echo "Error: package.json not found at $PACKAGE_JSON"
    exit 1
fi

# Extract version from package.json
VERSION=$(grep '"version"' "$PACKAGE_JSON" | sed 's/.*"version": *"\([^"]*\)".*/\1/')

if [ -z "$VERSION" ]; then
    echo "Error: Could not extract version from package.json"
    exit 1
fi

echo "Extracted version: $VERSION"

# Check if zip command exists
if ! grep -q '"zip":' "$PACKAGE_JSON"; then
    echo "Error: No zip command found in package.json"
    exit 1
fi

echo "Current zip command:"
grep '"zip":' "$PACKAGE_JSON"

# Create a backup of the original file
cp "$PACKAGE_JSON" "$PACKAGE_JSON.backup"

# Update the zip command in package.json
# Replace only the VERSION variable assignment in the zip command
sed -i.tmp "s/VERSION=\\\\\"v[0-9.]*\\\\\"/VERSION=\\\\\"$VERSION\\\\\"/" "$PACKAGE_JSON"

# Remove the temporary file created by sed
rm -f "$PACKAGE_JSON.tmp"

echo ""
echo "Updated zip command:"
grep '"zip":' "$PACKAGE_JSON"

echo ""
echo "Successfully updated zip command with version: $VERSION"
