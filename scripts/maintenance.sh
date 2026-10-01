#!/bin/bash
set -euo pipefail

case "${1:-}" in
  "")
    npm install
    ;;
  --clean)
    npm ci
    ;;
  *)
    echo "Usage: $0 [--clean]" >&2
    exit 2
    ;;
esac

npx playwright install --with-deps chromium

if ! command -v dot >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update
    sudo apt-get install --yes graphviz
  elif command -v brew >/dev/null 2>&1; then
    brew install graphviz
  else
    echo "Graphviz is required but neither apt-get nor Homebrew is available." >&2
    exit 1
  fi
fi

dot -V
