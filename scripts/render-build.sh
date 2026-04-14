#!/usr/bin/env bash

set -euo pipefail

SPACETIMEDB_VERSION="${SPACETIMEDB_VERSION:-2.1.0}"

if ! command -v spacetime >/dev/null 2>&1 && ! command -v spacetimedb-cli >/dev/null 2>&1; then
  echo "SpacetimeDB CLI not found; installing ${SPACETIMEDB_VERSION} to ${HOME}/.spacetimedb"
  curl -sSf https://install.spacetimedb.com | sh -s -- --root-dir "${HOME}/.spacetimedb" -y
  export PATH="${HOME}/.spacetimedb:${HOME}/.spacetimedb/bin/current:${PATH}"
  spacetime version install "${SPACETIMEDB_VERSION}" --use -y
else
  echo "SpacetimeDB CLI already available"
fi

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo not found; installing Rust toolchain with rustup"
  curl https://sh.rustup.rs -sSf | sh -s -- -y
  # shellcheck disable=SC1090
  source "${HOME}/.cargo/env"
else
  echo "cargo already available"
fi

if command -v rustup >/dev/null 2>&1; then
  rustup target add wasm32-unknown-unknown
fi

echo "installing pnpm@10.32.1"
npm install --global pnpm@10.32.1
pnpm install --frozen-lockfile
pnpm build
