#!/usr/bin/env sh
# Run tests across the workspace for every package that defines a `test`
# script. Does not load .env (tests should not depend on secrets).
set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "${_root_dir}"

exec pnpm -r --if-present test
