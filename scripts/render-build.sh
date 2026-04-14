#!/usr/bin/env bash

set -euo pipefail

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
sh "${_root_dir}/scripts/ensure-spacetimedb-toolchain-ci.sh"
# shellcheck disable=SC1090
. "${HOME}/.cargo/env" 2>/dev/null || true
export PATH="${HOME}/.spacetimedb:${HOME}/.spacetimedb/bin/current:${PATH}"
export PATH="${HOME}/.cargo/bin:${PATH}"

echo "installing pnpm@10.32.1"
npm install --global pnpm@10.32.1
pnpm install --frozen-lockfile
pnpm build
