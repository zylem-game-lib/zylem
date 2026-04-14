#!/usr/bin/env sh
# Resolve SpacetimeDB CLI: SPACETIME_CLI, repo-local .tools install, or PATH.
# On CI (Render native Node sets CI=true), installs toolchain via repo scripts/ensure-spacetimedb-toolchain-ci.sh.
# POSIX sh so `pnpm run` does not require `bash` on PATH (e.g. some CI images).
set -eu
_pkg_root="$(cd "$(dirname "$0")/.." && pwd)"
_repo_root="$(cd "${_pkg_root}/../.." && pwd)"
_repo_local_root="${_repo_root}/.tools/spacetimedb"
_default_cli="${_repo_local_root}/bin/current/spacetimedb-cli"
_ensure="${_repo_root}/scripts/ensure-spacetimedb-toolchain-ci.sh"

if [ -x "${_repo_local_root}/spacetime" ]; then
  export PATH="${_repo_local_root}:${PATH}"
fi

if [ -n "${SPACETIME_CLI:-}" ]; then
  exec "${SPACETIME_CLI}" "$@"
elif [ -x "${_default_cli}" ]; then
  exec "${_default_cli}" "$@"
elif command -v spacetime >/dev/null 2>&1; then
  exec spacetime "$@"
elif command -v spacetimedb-cli >/dev/null 2>&1; then
  exec spacetimedb-cli "$@"
elif [ "${CI:-}" = "true" ] || [ "${RENDER:-}" = "true" ] || [ "${SPACETIME_AUTO_INSTALL_TOOLCHAIN:-}" = "1" ]; then
  sh "${_ensure}"
  export PATH="${HOME}/.spacetimedb:${HOME}/.spacetimedb/bin/current:${PATH}"
  export PATH="${HOME}/.cargo/bin:${PATH}"
  if [ -n "${SPACETIME_CLI:-}" ]; then
    exec "${SPACETIME_CLI}" "$@"
  elif [ -x "${_default_cli}" ]; then
    exec "${_default_cli}" "$@"
  elif command -v spacetime >/dev/null 2>&1; then
    exec spacetime "$@"
  elif command -v spacetimedb-cli >/dev/null 2>&1; then
    exec spacetimedb-cli "$@"
  fi
  echo "SpacetimeDB CLI not found after CI toolchain install. See packages/server/README.md" >&2
  exit 127
else
  echo "SpacetimeDB CLI not found. Install: https://spacetimedb.com/install" >&2
  echo "Or set SPACETIME_CLI, or install to repo .tools/spacetimedb (see packages/server/README.md)." >&2
  exit 127
fi
