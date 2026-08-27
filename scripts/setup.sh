#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"

echo "[codex] bootstrapping repository environment"

command -v node >/dev/null || { echo "Node.js is required." >&2; exit 69; }
command -v npm >/dev/null || { echo "npm is required." >&2; exit 69; }

npm ci

# The E2E suite currently targets Chromium only. Install both the browser and
# its OS dependencies so a fresh Codex environment can run npm run test:e2e.
npx playwright install --with-deps chromium

# Generate derived story fixtures once so the working tree starts from the
# repository's canonical raw evidence.
npm run generate:fixture

echo "[codex] setup complete"
