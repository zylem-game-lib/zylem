#!/usr/bin/env sh
# Resolve SpacetimeDB CLI: SPACETIME_CLI, repo-local .tools install, or PATH.
# POSIX sh so `pnpm run` does not require `bash` on PATH (e.g. some CI images).
set -eu
_pkg_root="$(cd "$(dirname "$0")/.." && pwd)"
_repo_root="$(cd "${_pkg_root}/../.." && pwd)"
_repo_local_root="${_repo_root}/.tools/spacetimedb"
_default_cli="${_repo_local_root}/bin/current/spacetimedb-cli"

if [ -x "${_repo_local_root}/spacetime" ]; then
  export PATH="${_repo_local_root}:${PATH}"
fi

if [ -n "${SPACETIME_CLI:-}" ]; then
  exec "${SPACETIME_CLI}" "$@"
elif [ -x "${_default_cli}" ]; then
  exec "${_default_cli}" "$@"
elif command -v spacetime >/dev/null 2>&1; then
  exec spacetime "$@"
else
  exec spacetimedb-cli "$@"
fi
