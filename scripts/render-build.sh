#!/usr/bin/env sh

set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"

sh "${_root_dir}/scripts/ensure-rust-wasm-ci.sh"
if [ -f "${HOME}/.cargo/env" ]; then
  # shellcheck disable=SC1090
  . "${HOME}/.cargo/env"
fi
export PATH="${HOME}/.cargo/bin:${PATH}"

cd "${_root_dir}"

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm already available: $(pnpm --version)"
else
  corepack enable
  corepack prepare pnpm@10.33.0 --activate
fi
pnpm install --frozen-lockfile
export NODE_ENV=production

# Build the wasm runtime explicitly first: `examples` imports the .wasm at Vite
# build time (packages/examples/src/runtime/zylem-runtime.ts), so the file must
# exist on disk before `pnpm -r build` reaches the examples package. We invoke
# `build:wasm` directly to skip the redundant native cargo build that runtime's
# default `build` script also performs.
pnpm --filter "@zylem/runtime" run build:wasm

# Build everything `examples` depends on, in topological order, with pnpm's
# default workspace concurrency. styles + game-lib can run in parallel, then
# editor, then examples. Excluding `@zylem/runtime` avoids re-running the
# wasm/native cargo build above; type/dts resolution remains safe because pnpm
# respects the topo order of the JS workspace graph.
pnpm --filter "@zylem/examples..." --filter "!@zylem/runtime" -r run build
