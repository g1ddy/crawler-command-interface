#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[codex] bootstrapping fresh repository environment"

# A fresh environment should always perform the full reusable maintenance path,
# including npm install state and Playwright system dependencies.
CODEX_FORCE_REFRESH=1 exec "${script_dir}/maintenance.sh"
