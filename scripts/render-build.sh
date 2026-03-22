#!/usr/bin/env bash

set -euo pipefail

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
