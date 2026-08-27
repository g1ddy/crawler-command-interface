#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"

echo "[codex] maintaining repository environment"

command -v node >/dev/null || { echo "Node.js is required." >&2; exit 69; }
command -v npm >/dev/null || { echo "npm is required." >&2; exit 69; }
command -v sha256sum >/dev/null || { echo "sha256sum is required." >&2; exit 69; }

stamp_dir="${project_root}/.codex"
stamp_file="${stamp_dir}/package-lock.sha256"
mkdir -p "${stamp_dir}"

current_lock_sha="$(sha256sum package-lock.json | awk '{print $1}')"
previous_lock_sha="$(cat "${stamp_file}" 2>/dev/null || true)"
refresh_dependencies=0

if [[ "${CODEX_FORCE_REFRESH:-0}" == "1" || ! -d node_modules || "${current_lock_sha}" != "${previous_lock_sha}" ]]; then
  refresh_dependencies=1
  echo "[codex] dependency state changed; running npm ci"
  npm ci
  printf '%s\n' "${current_lock_sha}" > "${stamp_file}"
else
  echo "[codex] npm dependencies are current"
fi

# A Playwright version change can also change the browser's Linux library
# requirements. Refresh OS dependencies whenever the npm graph is refreshed;
# unchanged task resumes use the cheaper browser-only check.
if [[ "${refresh_dependencies}" == "1" ]]; then
  npx playwright install --with-deps chromium
else
  npx playwright install chromium
fi

# Refresh generated compatibility/runtime fixtures from canonical raw evidence.
npm run generate:fixture

echo "[codex] maintenance complete"
