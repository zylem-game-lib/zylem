#!/usr/bin/env bash
# Run typecheck, lint, and production build after toolchain install (CI / one-shot).
# Ensures PATH includes SpacetimeDB + Rust after scripts/ensure-spacetimedb-toolchain-ci.sh.
set -euo pipefail

_root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${_root_dir}"

sh "${_root_dir}/scripts/ensure-spacetimedb-toolchain-ci.sh"

export PATH="${HOME}/.spacetimedb:${HOME}/.spacetimedb/bin/current:${PATH}"
export PATH="${HOME}/.cargo/bin:${PATH}"
if [ -f "${HOME}/.cargo/env" ]; then
	# shellcheck disable=SC1090
	. "${HOME}/.cargo/env"
fi

pnpm run typecheck
pnpm run lint
pnpm run build:production
