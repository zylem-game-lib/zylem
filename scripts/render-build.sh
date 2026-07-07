#!/usr/bin/env sh

set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"

cd "${_root_dir}"

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm already available: $(pnpm --version)"
else
  corepack enable
  corepack prepare pnpm@10.33.0 --activate
fi
pnpm install --frozen-lockfile
export NODE_ENV=production

# Build everything `examples` depends on, in topological order, with pnpm's
# default workspace concurrency. The wasm runtime comes prebuilt from the
# @zylem/runtime npm package, so no Rust toolchain is needed here.
pnpm --filter "@zylem/examples..." -r run build
