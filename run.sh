#!/usr/bin/env bash
set -e

# Ensure ~/.local/bin is in PATH for Node.js
export PATH="$HOME/.local/bin:$PATH"

echo "=================================================="
echo "      BOTTLEMAIL — Starting Local Server          "
echo "=================================================="

# Check node
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not found in PATH."
    exit 1
fi

echo "Node Version: $(node -v)"
echo "NPM Version:  $(npm -v)"

# Check if data directory or db exists
if [ ! -f "data/bottlemail.db" ]; then
    echo "Initializing and seeding bottlemail database..."
    node scripts/seed.mjs
fi

echo "Starting bottlemail on http://localhost:3000 ..."
npm run start
