#!/usr/bin/env sh

set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"

sh "${_root_dir}/scripts/ensure-rust-wasm-ci.sh"
# shellcheck disable=SC1090
. "${HOME}/.cargo/env" 2>/dev/null || true
export PATH="${HOME}/.cargo/bin:${PATH}"

cd "${_root_dir}"

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm already available: $(pnpm --version)"
else
  corepack enable
  corepack prepare pnpm@10.33.0 --activate
fi
pnpm install --frozen-lockfile
pnpm --filter "@zylem/runtime" run build:wasm
pnpm --filter "@zylem/styles" run build
pnpm --filter "@zylem/game-lib" run build
pnpm --filter "@zylem/editor" run build
pnpm --filter "@zylem/examples" run build
