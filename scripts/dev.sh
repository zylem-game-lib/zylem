#!/usr/bin/env sh
# Run a package in dev/watch mode. Defaults to @zylem/editor; pass a package
# name to override (e.g. `sh scripts/dev.sh @zylem/game-lib`).
set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "${_root_dir}"

exec pnpm --filter "${1:-@zylem/editor}" dev
