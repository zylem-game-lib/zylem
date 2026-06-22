#!/usr/bin/env sh
# Build the workspace. With no args builds every package in dependency
# (topological) order; pass a package name to build just that one
# (e.g. `sh scripts/build.sh @zylem/game-lib`).
set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "${_root_dir}"

. "${_root_dir}/scripts/load-env.sh"
export NODE_ENV="${NODE_ENV:-production}"

if [ "$#" -gt 0 ]; then
  exec pnpm --filter "$@" build
fi

exec pnpm -r build
