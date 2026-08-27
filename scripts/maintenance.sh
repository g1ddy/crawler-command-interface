#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"

echo "[codex] maintaining repository environment"

command -v node >/dev/null || { echo "Node.js is required." >&2; exit 69; }
command -v npm >/dev/null || { echo "npm is required." >&2; exit 69; }

stamp_dir="${project_root}/.codex"
stamp_file="${stamp_dir}/package-lock.sha256"
mkdir -p "${stamp_dir}"

current_lock_sha="$(sha256sum package-lock.json | awk '{print $1}')"
previous_lock_sha="$(cat "${stamp_file}" 2>/dev/null || true)"

if [[ ! -d node_modules || "${current_lock_sha}" != "${previous_lock_sha}" ]]; then
  echo "[codex] package-lock changed or node_modules is missing; running npm ci"
  npm ci
  printf '%s\n' "${current_lock_sha}" > "${stamp_file}"
else
  echo "[codex] npm dependencies are current"
fi

# Keep the browser required by the E2E suite available after environment
# refreshes. This command is idempotent when the matching browser is installed.
npx playwright install chromium

# Refresh generated compatibility/runtime fixtures from canonical raw evidence.
npm run generate:fixture

echo "[codex] maintenance complete"
