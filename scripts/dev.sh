#!/usr/bin/env sh
# Run a package in dev/watch mode. Defaults to @zylem/game-lib; pass a package
# name to override (e.g. `sh scripts/dev.sh @zylem/bridge`). The editor lives
# in its own repo now (zylem-game-lib/editor); run `pnpm dev` there instead.
set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "${_root_dir}"

exec pnpm --filter "${1:-@zylem/game-lib}" dev
