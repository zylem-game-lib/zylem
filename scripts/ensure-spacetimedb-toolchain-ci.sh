#!/usr/bin/env sh
# Idempotent: ensure SpacetimeDB CLI and Rust + wasm32-unknown-unknown for `spacetime build`.
# Safe to run from CI (Render sets CI=true), local `./scripts/render-build.sh`, or when
# packages/server/scripts/run-spacetimedb-cli.sh triggers auto-install.
set -eu

_script_dir="$(cd "$(dirname "$0")" && pwd)"
SPACETIMEDB_VERSION="${SPACETIMEDB_VERSION:-2.1.0}"

export PATH="${HOME}/.spacetimedb:${HOME}/.spacetimedb/bin/current:${PATH}"
export PATH="${HOME}/.cargo/bin:${PATH}"

if ! command -v spacetime >/dev/null 2>&1 && ! command -v spacetimedb-cli >/dev/null 2>&1; then
  echo "SpacetimeDB CLI not found; installing ${SPACETIMEDB_VERSION} to \${HOME}/.spacetimedb"
  curl -sSf https://install.spacetimedb.com | sh -s -- --root-dir "${HOME}/.spacetimedb" -y
  export PATH="${HOME}/.spacetimedb:${HOME}/.spacetimedb/bin/current:${PATH}"
  spacetime version install "${SPACETIMEDB_VERSION}" --use -y
else
  echo "SpacetimeDB CLI already available"
fi

sh "${_script_dir}/ensure-rust-wasm-ci.sh"
