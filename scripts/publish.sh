#!/usr/bin/env sh
# Build and publish the public library (@zylem/game-lib only; all other
# workspace packages are private). Loads .env and injects NPM_TOKEN as the
# registry auth token for this publish only (the root .npmrc intentionally
# omits the token so normal pnpm commands stay warning-free).
set -eu

_root_dir="$(cd "$(dirname "$0")/.." && pwd)"
cd "${_root_dir}"

. "${_root_dir}/scripts/load-env.sh"
export NODE_ENV=production

if [ -z "${NPM_TOKEN:-}" ]; then
  echo "NPM_TOKEN not set (expected in .env) - cannot publish" >&2
  exit 1
fi

pnpm --filter @zylem/game-lib build
exec env "npm_config_//registry.npmjs.org/:_authToken=${NPM_TOKEN}" \
  pnpm --filter @zylem/game-lib publish --access public
