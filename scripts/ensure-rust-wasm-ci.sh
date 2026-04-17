#!/usr/bin/env sh
# Idempotent: ensure Rust and wasm32-unknown-unknown are available for wasm builds.
set -eu

export PATH="${HOME}/.cargo/bin:${PATH}"

if ! command -v cargo >/dev/null 2>&1; then
  echo "cargo not found; installing Rust toolchain with rustup"
  # --no-modify-path: CI images often disallow writing shell profile files.
  curl https://sh.rustup.rs -sSf | sh -s -- -y --no-modify-path --default-toolchain stable
  export PATH="${HOME}/.cargo/bin:${PATH}"
  if [ -f "${HOME}/.cargo/env" ]; then
    # shellcheck disable=SC1090
    . "${HOME}/.cargo/env"
  fi
else
  echo "cargo already available"
fi

if command -v rustup >/dev/null 2>&1; then
  rustup target add wasm32-unknown-unknown
else
  echo "rustup not found; assuming wasm32-unknown-unknown is already available"
fi
