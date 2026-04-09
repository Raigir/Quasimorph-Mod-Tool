#!/usr/bin/env bash
set -e

echo "========================================"
echo "  Mod Workflow Tool - Starting..."
echo "========================================"
echo ""

cd "$(dirname "$0")"

mkdir -p data

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found."
    echo ""
    echo "Install it:"
    echo "  macOS:   brew install node"
    echo "  Ubuntu:  sudo apt install nodejs"
    echo "  Or:      https://nodejs.org"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "[OK] Node.js $(node -v)"
echo ""

# Open browser
URL="http://localhost:8080"
if command -v xdg-open &> /dev/null; then
    xdg-open "$URL" &
elif command -v open &> /dev/null; then
    open "$URL" &
fi

node server.js
